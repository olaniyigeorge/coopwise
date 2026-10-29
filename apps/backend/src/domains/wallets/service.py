# app/services/wallet_service.py
import json
import secrets
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from src.domains.wallets.models import (
    LedgerStatus,
    LedgerType,
    PaymentGateway,
    Wallet,
    LocalCurrency,
    WalletLedger,
    WalletWithdrawal,
    WithdrawalStatus,
    StableCurrency,
)
from src.domains.wallets.schemas import (
    WalletDeposit,
    WalletDetail,
    WalletLedgerCreate,
    WalletLedgerDetail,
    WalletWithdraw,
)
from src.domains.auth.schemas import AuthenticatedUser
from fastapi import HTTPException
from decimal import Decimal
from src.shared.utils.logger import logger
from src.shared.money import MOCK_LOCAL_TO_STABLE_RATE, to_kobo, to_micro
from uuid import UUID, uuid4
from redis.asyncio import Redis
from src.infra.cache.redis_client import get_cache, update_cache
from typing import Dict, Any


def _internal_ledger_reference(kind: str) -> str:
    """WalletLedger.reference is NOT NULL + unique — internal (non-gateway)
    ledger entries (deposit/withdraw/lock/finalize/release) never went
    through a payment gateway that hands back a reference of its own, so
    they need one generated here or every insert violates the NOT NULL
    constraint."""
    return f"{kind}-{secrets.token_hex(12)}"


# The mock local->stable rate is defined once in src.shared.money (re-exported
# here because other modules import it from this one).


class WalletService:

    @staticmethod
    async def create_user_wallet(user: AuthenticatedUser, db: AsyncSession) -> Wallet:
        """
        Create a wallet entry for a new user. Called at user signup.
        """
        new_wallet = Wallet(user_id=user.id, local_currency=LocalCurrency.NGN)
        db.add(new_wallet)
        await db.commit()
        await db.refresh(new_wallet)
        return new_wallet

    @staticmethod
    async def deposit(
        data: WalletDeposit, db: AsyncSession, user: AuthenticatedUser, redis: Redis
    ) -> WalletDetail:
        """
        User deposits `local_amount` in their local currency. We:
         1. Get user's wallet
         2. Fetch current exchange rate from Accurue Cashramp GraphQL API and calc deposit amount in stable coin currency
         3. Credit user's wallet(stable_coin_balance) with stable_coin amount after exchange
         4. Record ledger
         5. Return User's wallet details
        """
        # 1. Fetch the user’s wallet
        stmt = select(Wallet).where(Wallet.user_id == user.id)
        result = await db.execute(stmt)
        wallet = result.scalars().first()

        if not wallet:
            logger.warning(f"⚠️ Wallet not found for user {user.id}")
            wallet = await WalletService.create_user_wallet(user, db)
            # raise HTTPException(status_code=404, detail="Wallet not found")

        logger.info(
            f"\n\n\nUser {user.id} is depositing {data.local_amount} {data.currency} into their wallet\n\n\n"
        )
        # 2. Fetch exchange rate quote from CashRamp GraphQL API
        # TODO (use actual exchange rate func) await fetch_exchange_rate(user.id, data.currency, "USDC")
        rate = MOCK_LOCAL_TO_STABLE_RATE
        stable_amt = Decimal(data.local_amount) * Decimal(rate)

        logger.info(f"\n\n\n Stable amount settled into wallet {stable_amt} \n\n\n")

        # 3. Credit the wallet (rounded once, into whole micro-units)
        stable_micro = to_micro(stable_amt)
        wallet.stable_coin_balance_micro += stable_micro
        await db.commit()
        await db.refresh(wallet)

        # 4. Add ledger entry
        ledger = WalletLedger(
            wallet_id=wallet.id,
            reference=_internal_ledger_reference("deposit"),
            type=LedgerType.deposit,
            stable_amount_micro=stable_micro,
            local_amount_minor=to_kobo(data.local_amount),
            local_currency=data.currency,
            exchange_rate=Decimal(rate),
        )
        db.add(ledger)
        await db.commit()

        # 5. Invalidate/refresh the cached wallet
        wallet_data = WalletDetail.model_validate(wallet)
        logger.info("\n updating cache...\n")
        await update_cache(
            f"wallet_detail:{user.id}", wallet_data.model_dump_json(), ttl=300
        )

        return WalletDetail.model_validate(wallet)

    @staticmethod
    async def withdraw(
        data: WalletWithdraw, db: AsyncSession, user: AuthenticatedUser, redis: Redis
    ) -> dict:
        """
        User withdraws `local_amount` in their local currency. We:
        1. Fetch user's wallet
        2. Fetch from Accurue Cashramp (or get from cache) exchange rate for local → stable
        3. Convert local amount to stable coin and check wallet balance
        4. Debit stable_coin_balance
        5. Record ledger
        6. Return wallet details and success message
        """
        # 1. Fetch wallet
        stmt = select(Wallet).where(Wallet.user_id == user.id)
        result = await db.execute(stmt)
        wallet = result.scalar_one_or_none()
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")

        # 2. Get exchange rate from Redis cache or fetch new
        cache_key = f"exchange_rate:{wallet.local_currency}:USDC"
        cached_rate = await get_cache(cache_key)

        if cached_rate:
            rate = Decimal(cached_rate)
        else:
            # TODO Replace with actual await fetch_exchange_rate(user.id, wallet.local_currency, "USDC") call
            rate = MOCK_LOCAL_TO_STABLE_RATE
            await update_cache(
                cache_key, str(rate), ttl=30
            )  # Match the 20 - 50 market votality suggested by Accurue Cashramp

        # 3. Convert local amount → stable coin
        stable_micro = to_micro(Decimal(data.local_amount) * rate)

        if stable_micro > wallet.stable_coin_balance_micro:
            raise HTTPException(
                status_code=400, detail="Insufficient stable coin balance"
            )

        # 4. Debit balance
        wallet.stable_coin_balance_micro -= stable_micro
        await db.commit()
        await db.refresh(wallet)

        # 5. Record ledger
        ledger = WalletLedger(
            wallet_id=wallet.id,
            reference=_internal_ledger_reference("withdrawal"),
            type=LedgerType.withdrawal,
            stable_amount_micro=stable_micro,
            local_amount_minor=to_kobo(data.local_amount),
            local_currency=wallet.local_currency,
            exchange_rate=rate,
        )
        db.add(ledger)
        await db.commit()

        # 6. Return wallet detail and message
        wallet_data = WalletDetail.model_validate(wallet)
        await update_cache(
            f"wallet_detail:{user.id}", wallet_data.model_dump_json(), ttl=300
        )
        return {
            "message": "Withdrawal successful",
            "wallet": WalletDetail.model_validate(wallet),
        }

    @staticmethod
    async def lock_for_contribution(
        user_id: UUID, amount: Decimal, db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Lock funds in user's wallet for a contribution.
        Moves amount from stable_coin_balance to stable_coin_locked.
        """
        try:
            stmt = select(Wallet).where(Wallet.user_id == user_id)
            result = await db.execute(stmt)
            wallet = result.scalars().first()

            if not wallet:
                return {"success": False, "error": "Wallet not found"}

            amount_micro = to_micro(amount)
            if wallet.stable_coin_balance_micro < amount_micro:
                return {"success": False, "error": "Insufficient balance"}

            # Lock the funds
            wallet.stable_coin_balance_micro -= amount_micro
            wallet.stable_coin_locked_micro = (
                wallet.stable_coin_locked_micro or 0
            ) + amount_micro

            await db.commit()
            await db.refresh(wallet)

            # Create ledger entry for lock
            ledger = WalletLedger(
                wallet_id=wallet.id,
                reference=_internal_ledger_reference("lock"),
                type=LedgerType.debit_locked,
                stable_amount_micro=-amount_micro,  # Negative for debit
                local_amount_minor=0,  # Not applicable for internal transfer
                local_currency=wallet.local_currency,
                exchange_rate=Decimal(1),
                note="Funds locked for contribution",
            )
            db.add(ledger)
            await db.commit()

            logger.info(f"Locked {amount} for user {user_id} contribution")

            return {"success": True, "locked_amount": amount}

        except Exception as e:
            logger.error(f"Failed to lock funds for contribution: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    async def finalize_contribution_debit(
        user_id: UUID, amount: Decimal, db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Finalize a contribution by removing locked funds permanently.
        Called when contribution is successfully completed onchain.
        """
        try:
            stmt = select(Wallet).where(Wallet.user_id == user_id)
            result = await db.execute(stmt)
            wallet = result.scalars().first()

            if not wallet:
                return {"success": False, "error": "Wallet not found"}

            amount_micro = to_micro(amount)
            if (wallet.stable_coin_locked_micro or 0) < amount_micro:
                return {"success": False, "error": "Insufficient locked funds"}

            # Remove from locked (funds are now in contribution pool)
            wallet.stable_coin_locked_micro -= amount_micro

            await db.commit()
            await db.refresh(wallet)

            # Create ledger entry for finalization
            ledger = WalletLedger(
                wallet_id=wallet.id,
                reference=_internal_ledger_reference("finalize"),
                type=LedgerType.debit_finalize,
                stable_amount_micro=-amount_micro,
                local_amount_minor=0,
                local_currency=wallet.local_currency,
                exchange_rate=Decimal(1),
                note="Contribution finalized - funds moved to group pool",
            )
            db.add(ledger)
            await db.commit()

            logger.info(f"Finalized contribution debit of {amount} for user {user_id}")

            return {"success": True, "finalized_amount": amount}

        except Exception as e:
            logger.error(f"Failed to finalize contribution debit: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    async def release_locked_funds(
        user_id: UUID, amount: Decimal, db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Release locked funds back to available balance.
        Called when contribution fails or is cancelled.
        """
        try:
            stmt = select(Wallet).where(Wallet.user_id == user_id)
            result = await db.execute(stmt)
            wallet = result.scalars().first()

            if not wallet:
                return {"success": False, "error": "Wallet not found"}

            amount_micro = to_micro(amount)
            if (wallet.stable_coin_locked_micro or 0) < amount_micro:
                return {
                    "success": False,
                    "error": "Insufficient locked funds to release",
                }

            # Move back to available balance
            wallet.stable_coin_locked_micro -= amount_micro
            wallet.stable_coin_balance_micro += amount_micro

            await db.commit()
            await db.refresh(wallet)

            # Create ledger entry for release
            ledger = WalletLedger(
                wallet_id=wallet.id,
                reference=_internal_ledger_reference("release"),
                type=LedgerType.debit_revert,
                stable_amount_micro=amount_micro,  # Positive for credit back
                local_amount_minor=0,
                local_currency=wallet.local_currency,
                exchange_rate=Decimal(1),
                note="Locked funds released due to failed contribution",
            )
            db.add(ledger)
            await db.commit()

            logger.info(f"Released {amount} locked funds for user {user_id}")

            return {"success": True, "released_amount": amount}

        except Exception as e:
            logger.error(f"Failed to release locked funds: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    async def get_effective_balance(user_id: UUID, db: AsyncSession) -> Decimal:
        """
        Get the effective available balance (total - locked).
        """
        try:
            stmt = select(Wallet).where(Wallet.user_id == user_id)
            result = await db.execute(stmt)
            wallet = result.scalars().first()

            if not wallet:
                return Decimal(0)

            return wallet.stable_coin_balance

        except Exception as e:
            logger.error(f"Failed to get effective balance: {e}")
            return Decimal(0)

    @staticmethod
    async def credit_payout(
        user_id: UUID,
        local_amount: Decimal,
        currency: str,
        reference: str,
        db: AsyncSession,
    ) -> Wallet:
        """Credit a cooperative payout into the member's wallet."""
        wallet_result = await db.execute(
            select(Wallet).where(Wallet.user_id == user_id)
        )
        wallet = wallet_result.scalars().first()
        if not wallet:
            wallet = Wallet(user_id=user_id, local_currency=LocalCurrency(currency))
            db.add(wallet)
            await db.flush()

        existing = await WalletService.get_wallet_ledger_by_reference(reference, db)
        if existing:
            return wallet

        stable_amount = Decimal(str(local_amount)) * MOCK_LOCAL_TO_STABLE_RATE
        stable_micro = to_micro(stable_amount)
        wallet.stable_coin_balance_micro += stable_micro
        db.add(
            WalletLedger(
                reference=reference,
                wallet_id=wallet.id,
                type=LedgerType.deposit,
                stable_amount_micro=stable_micro,
                stable_currency=StableCurrency.usdc,
                local_amount_minor=to_kobo(local_amount),
                local_currency=LocalCurrency(currency),
                exchange_rate=MOCK_LOCAL_TO_STABLE_RATE,
                gateway=PaymentGateway.coopwise_network,
                status=LedgerStatus.settled,
                note="Cooperative payout credited to wallet",
            )
        )
        await db.commit()
        await db.refresh(wallet)
        return wallet

    @staticmethod
    async def reserve_withdrawal(
        user_id: UUID, local_amount: Decimal, db: AsyncSession
    ) -> WalletWithdrawal:
        """Reserve wallet funds before starting a bank transfer."""
        result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
        wallet = result.scalars().first()
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")

        stable_micro = to_micro(Decimal(str(local_amount)) * MOCK_LOCAL_TO_STABLE_RATE)
        if stable_micro <= 0:
            raise HTTPException(
                status_code=400, detail="Withdrawal amount must be positive"
            )
        if wallet.stable_coin_balance_micro < stable_micro:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")

        withdrawal_id = uuid4()
        reference = f"withdrawal-{withdrawal_id}"
        withdrawal = WalletWithdrawal(
            id=withdrawal_id,
            reference=reference,
            wallet_id=wallet.id,
            local_amount_minor=to_kobo(local_amount),
            stable_amount_micro=stable_micro,
            local_currency=wallet.local_currency,
            status=WithdrawalStatus.pending,
            bank_name="",
            bank_code="",
            account_number_last4="",
        )
        wallet.stable_coin_balance_micro -= stable_micro
        db.add(withdrawal)
        await db.commit()
        await db.refresh(withdrawal)
        return withdrawal

    @staticmethod
    async def set_withdrawal_provider(
        withdrawal_id: UUID,
        recipient_code: str,
        provider_reference: str,
        bank_name: str,
        bank_code: str,
        account_number_last4: str,
        db: AsyncSession,
    ) -> WalletWithdrawal:
        withdrawal = await db.get(WalletWithdrawal, withdrawal_id)
        if not withdrawal:
            raise HTTPException(status_code=404, detail="Withdrawal not found")
        withdrawal.recipient_code = recipient_code
        withdrawal.provider_reference = provider_reference
        withdrawal.bank_name = bank_name
        withdrawal.bank_code = bank_code
        withdrawal.account_number_last4 = account_number_last4
        withdrawal.status = WithdrawalStatus.processing
        await db.commit()
        await db.refresh(withdrawal)
        return withdrawal

    @staticmethod
    async def get_withdrawal_by_provider_reference(
        provider_reference: str, db: AsyncSession
    ) -> WalletWithdrawal | None:
        result = await db.execute(
            select(WalletWithdrawal).where(
                WalletWithdrawal.provider_reference == provider_reference
            )
        )
        return result.scalars().first()

    @staticmethod
    async def mark_withdrawal_from_provider(
        withdrawal: WalletWithdrawal,
        success: bool,
        reversed: bool,
        reason: str | None,
        db: AsyncSession,
    ) -> WalletWithdrawal:
        if withdrawal.status in (
            WithdrawalStatus.completed,
            WithdrawalStatus.failed,
            WithdrawalStatus.reversed,
        ):
            return withdrawal

        if success:
            withdrawal.status = WithdrawalStatus.completed
            withdrawal.completed_at = datetime.now(timezone.utc)
        else:
            withdrawal.status = (
                WithdrawalStatus.reversed if reversed else WithdrawalStatus.failed
            )
            withdrawal.failure_reason = reason or "Bank transfer failed"
            wallet = await db.get(Wallet, withdrawal.wallet_id)
            if wallet:
                wallet.stable_coin_balance_micro += withdrawal.stable_amount_micro
                db.add(
                    WalletLedger(
                        reference=f"refund-{withdrawal.reference}",
                        wallet_id=wallet.id,
                        type=LedgerType.refund,
                        stable_amount_micro=withdrawal.stable_amount_micro,
                        stable_currency=StableCurrency.usdc,
                        local_amount_minor=withdrawal.local_amount_minor,
                        local_currency=withdrawal.local_currency,
                        exchange_rate=MOCK_LOCAL_TO_STABLE_RATE,
                        gateway=PaymentGateway.paystack,
                        status=LedgerStatus.settled,
                        note="Wallet withdrawal refunded after bank transfer failure",
                    )
                )
        await db.commit()
        await db.refresh(withdrawal)
        return withdrawal

    @staticmethod
    async def list_withdrawals(
        user_id: UUID, db: AsyncSession, limit: int = 20
    ) -> list[WalletWithdrawal]:
        result = await db.execute(
            select(WalletWithdrawal)
            .join(Wallet, Wallet.id == WalletWithdrawal.wallet_id)
            .where(Wallet.user_id == user_id)
            .order_by(WalletWithdrawal.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_wallet(
        db: AsyncSession, user: AuthenticatedUser, redis: Redis
    ) -> WalletDetail:
        """
        Fetch a user's wallet using their ID.
        Returns:
         - Wallet details
        Uses Redis cache for performance.
        """
        cache_key = f"wallet_detail:{user.id}"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(f"🔄 Using cached wallet for user {user.id}")
            if isinstance(cached, str):
                cached = json.loads(cached)
            return WalletDetail.model_validate(cached)

        logger.info(f"📬 Fetching wallet from db for user {user.id}")
        stmt = select(Wallet).where(Wallet.user_id == user.id)
        result = await db.execute(stmt)
        wallet = result.scalars().first()

        if not wallet:
            logger.warning(f"⚠️ Wallet not found for user {user.id}")
            wallet = await WalletService.create_user_wallet(user, db)
            # raise HTTPException(status_code=404, detail="Wallet not found")

        wallet_data = WalletDetail.model_validate(wallet)
        await update_cache(cache_key, wallet_data.model_dump_json(), ttl=30)
        return wallet_data

    @staticmethod
    async def get_wallet_ledger_by_reference(
        reference: str, db: AsyncSession
    ) -> WalletLedger | None:
        """
        Fetch a wallet ledger entry by its reference ID.

        Returns:
            WalletLedger object if found, else None
        """
        try:
            stmt = select(WalletLedger).where(WalletLedger.reference == reference)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(
                f"Failed to fetch wallet ledger by reference: {reference}. Error: {e}"
            )
            return None

    @staticmethod
    async def get_wallet_by_id(wallet_id: str, db: AsyncSession) -> Wallet | None:
        try:
            stmt = select(Wallet).where(Wallet.id == wallet_id)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Failed to fetch wallet by ID: {wallet_id}. Error: {e}")
            return None

    @staticmethod
    async def get_wallet_ledger_record_by_id(
        ledger_id: str, db: AsyncSession
    ) -> WalletLedgerDetail | None:
        """
        Fetch a wallet ledger record by its ID.
        """
        try:
            stmt = select(WalletLedger).where(WalletLedger.id == ledger_id)
            result = await db.execute(stmt)
            ledger = result.scalar_one_or_none()
            if ledger is None:
                return None
            return WalletLedgerDetail.model_validate(ledger)
        except Exception as e:
            logger.error(
                f"Failed to fetch wallet ledger by id: {ledger_id}. Error: {e}"
            )
            return None

    @staticmethod
    async def record_ledger_entry(
        ledger_data: WalletLedgerCreate, db: AsyncSession
    ) -> WalletLedger:
        """
        Record a ledger entry for a wallet operation (deposit, withdrawal, etc.)
        """
        ledger = WalletLedger(
            wallet_id=ledger_data.wallet_id,
            type=ledger_data.type,
            reference=ledger_data.reference,
            stable_amount_micro=to_micro(ledger_data.stable_amount),
            local_amount_minor=to_kobo(ledger_data.local_amount),
            local_currency=ledger_data.local_currency,
            exchange_rate=ledger_data.exchange_rate,
            status=ledger_data.status or LedgerStatus.initiated,
        )
        db.add(ledger)
        await db.commit()
        await db.refresh(ledger)
        return ledger

    @staticmethod
    async def update_ledger_status(
        ledger_id: UUID, status: LedgerStatus, db: AsyncSession
    ) -> WalletLedger:
        stmt = (
            update(WalletLedger)
            .where(WalletLedger.id == ledger_id)
            .values(status=status)
            .execution_options(synchronize_session="fetch")
        )
        await db.execute(stmt)
        await db.commit()

        result = await db.execute(
            select(WalletLedger).where(WalletLedger.id == ledger_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def settle_payment_ledger_into_wallet(
        ledger_id: str, db: AsyncSession, redis: Redis
    ):
        ledger = await WalletService.get_wallet_ledger_record_by_id(ledger_id, db)
        if not ledger:
            raise HTTPException(status_code=404, detail="Transaction ledger not found.")

        if ledger.status == LedgerStatus.settled:
            raise HTTPException(status_code=400, detail="Ledger already settled.")

        mark_ledger_record = await WalletService.update_ledger_status(
            ledger_id, LedgerStatus.settled, db
        )

        wallet = await WalletService.get_wallet_by_id(mark_ledger_record.wallet_id, db)
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found.")

        wallet.stable_coin_balance_micro += mark_ledger_record.stable_amount_micro
        db.add(wallet)
        await db.commit()
        await db.refresh(wallet)

        return wallet

    @staticmethod
    async def finalize_deposit(
        reference: str, db: AsyncSession, redis: Redis
    ) -> WalletDetail:
        """
        Idempotently settle a previously-initiated deposit (Paystack, etc.) by
        its ledger reference — credits the wallet and marks the ledger
        settled. Safe to call more than once for the same reference (e.g. a
        user re-visiting the payment callback URL after a refresh).
        """
        ledger = await WalletService.get_wallet_ledger_by_reference(reference, db)
        if not ledger:
            raise HTTPException(status_code=404, detail="Transaction ledger not found.")

        if ledger.status == LedgerStatus.settled:
            wallet = await WalletService.get_wallet_by_id(ledger.wallet_id, db)
            return WalletDetail.model_validate(wallet)

        wallet = await WalletService.settle_payment_ledger_into_wallet(
            ledger.id, db, redis
        )
        wallet_data = WalletDetail.model_validate(wallet)
        await update_cache(
            f"wallet_detail:{wallet.user_id}", wallet_data.model_dump_json(), ttl=300
        )
        return wallet_data

    @staticmethod
    async def fail_deposit(reference: str, db: AsyncSession) -> WalletLedger:
        """Mark an initiated/pending deposit as failed without crediting it."""
        ledger = await WalletService.get_wallet_ledger_by_reference(reference, db)
        if not ledger:
            raise HTTPException(status_code=404, detail="Transaction ledger not found.")
        if ledger.status == LedgerStatus.settled:
            return ledger
        if ledger.status != LedgerStatus.failed:
            ledger.status = LedgerStatus.failed
            await db.commit()
            await db.refresh(ledger)
        return ledger
