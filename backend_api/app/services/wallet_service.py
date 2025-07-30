# app/services/wallet_service.py
from datetime import datetime
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from db.models.wallet_models import (
    LedgerStatus,
    Wallet,
    LocalCurrency,
    WalletLedger,
    LedgerType,
)
from app.schemas.wallet_schemas import (
    WalletDeposit,
    WalletDetail,
    WalletLedgerCreate,
    WalletLedgerDetail,
    WalletWithdraw,
)
from app.schemas.auth import AuthenticatedUser
from app.utils.exchange_client import fetch_exchange_rate
from fastapi import HTTPException, status
from decimal import Decimal
from app.utils.logger import logger
from uuid import UUID
from redis.asyncio import Redis
from app.utils.cache import get_cache, update_cache


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
        rate = (
            1 / 1600
        )  # TODO (use actual exchange rate func) await fetch_exchange_rate(user.id, data.currency, "USDC")  ---  mock rate 1 USDC == 1600 NGN(local currency)
        stable_amt = Decimal(data.local_amount) * Decimal(rate)

        logger.info(f"\n\n\n Stable amount settled into wallet {stable_amt} \n\n\n")

        # 3. Credit the wallet
        wallet.stable_coin_balance += stable_amt
        await db.commit()
        await db.refresh(wallet)

        # 4. Add ledger entry
        ledger = WalletLedger(
            wallet_id=wallet.id,
            type=LedgerType.deposit,
            stable_amount=stable_amt,
            local_amount=Decimal(data.local_amount),
            local_currency=data.currency,
            exchange_rate=Decimal(rate),
        )
        db.add(ledger)
        await db.commit()

        # 5. TODO (Invalidate or update cached wallet if previously cached)
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
            rate = Decimal(1) / Decimal(1600)  # mock
            await update_cache(
                cache_key, str(rate), ttl=30
            )  # Match the 20 - 50 market votality suggested by Accurue Cashramp

        # 3. Convert local amount → stable coin
        stable_amt = Decimal(data.local_amount) * rate

        if stable_amt > wallet.stable_coin_balance:
            raise HTTPException(
                status_code=400, detail="Insufficient stable coin balance"
            )

        # 4. Debit balance
        wallet.stable_coin_balance -= stable_amt
        await db.commit()
        await db.refresh(wallet)

        # 5. Record ledger
        ledger = WalletLedger(
            wallet_id=wallet.id,
            type=LedgerType.withdrawal,
            stable_amount=stable_amt,
            local_amount=Decimal(data.local_amount),
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
        ledger_id: str,
        db: AsyncSession
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
            stable_amount=ledger_data.stable_amount,
            local_amount=ledger_data.local_amount,
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
    async def deposit_by_reference(reference: str, db: AsyncSession, redis: Redis):
        # Fetch the ledger
        ledger = await WalletService.get_wallet_ledger_by_reference(reference, db)
        if not ledger:
            raise HTTPException(status_code=404, detail="Transaction ledger not found.")

        # Fetch wallet and update balance
        wallet = await WalletService.get_wallet(ledger.wallet_id, db, redis)
        wallet.balance += ledger.stable_amount
        await db.commit()

        return wallet

    @staticmethod
    async def settle_payment_ledger_into_wallet(ledger_id: str, db: AsyncSession, redis: Redis):
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

        wallet.stable_coin_balance += mark_ledger_record.stable_amount
        db.add(wallet)

        return wallet
