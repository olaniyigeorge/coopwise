# app/services/wallet_service.py
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.models.wallet_models import Wallet, LocalCurrency, WalletLedger, LedgerType
from app.schemas.wallet_schemas import WalletDeposit, WalletDetail, WalletWithdraw, WalletBalance
from app.schemas.auth import AuthenticatedUser
from app.utils.exchange_client import fetch_exchange_rate
from fastapi import HTTPException, status
from decimal import Decimal
from app.utils.logger import logger
from uuid import UUID
from redis.asyncio import Redis
from app.utils.cache import get_cache, update_cache




ACCURUE_STAGING_URL = "https://staging.api.useaccrue.com/cashramp/api/graphql"
ACCURUE_PROD_URL = "https://api.useaccrue.com/cashramp/api/graphql"

class WalletService:

    # @staticmethod
    # async def ping_accurue():
    
    #     const cashramp = axios.create({
    #     baseURL: ACCURUE_STAGING_URL,
    #     headers: {
    #         Authorization: `Bearer ${process.env.CSHRMP_SECRET_KEY}`,
    #     },
    #     });
    #     return {
    #         "msg": "Success"
    #     }

    @staticmethod
    async def create_user_wallet(
        user: AuthenticatedUser, 
        db: AsyncSession
    ) -> Wallet:
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
        user: AuthenticatedUser,
        data: WalletDeposit,
        db: AsyncSession,
        redis: Redis
    ) -> WalletBalance:
        """
        User deposits `local_amount` in their local currency. We:
         1. Fetch current exchange rate local → stable
         2. credit stable_coin_balance
         3. record ledger
         4. return updated balances
        """
        # 1. Fetch the user’s wallet
        stmt = select(Wallet).where(Wallet.user_id == user.id)
        result = await db.execute(stmt)
        wallet = result.scalar_one_or_none()
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")

        # 2. Fetch rate via GraphQL
        rate = await fetch_exchange_rate(data.currency, "USDC")  # assume "USDC" is stable code

        stable_amt = Decimal(data.local_amount) * Decimal(rate)

        # 3. Credit the wallet
        wallet.stable_coin_balance += stable_amt
        await db.commit()
        await db.refresh(wallet)

        # 4. Add ledger entry
        ledger = WalletLedger(
            wallet_id=wallet.id,
            type=LedgerType.DEPOSIT,
            stable_amount=stable_amt,
            local_amount=Decimal(data.local_amount),
            local_currency=data.currency,
            exchange_rate=Decimal(rate)
        )
        db.add(ledger)
        await db.commit()

        # 5. Invalidate cached balance
        balance_cache_key = f"wallet_balance:{user.id}"
        await redis.delete(balance_cache_key)

        return await WalletService.get_balance(user, db, redis)

    @staticmethod
    async def withdraw(
        user: AuthenticatedUser,
        data: WalletWithdraw,
        db: AsyncSession,
        redis: Redis
    ) -> WalletBalance:
        """
        User withdraws `stable_amount` from their wallet into local currency.
        1. Get current rate
        2. Debit stable_coin_balance
        3. record ledger
        4. return updated balances
        """
        stmt = select(Wallet).where(Wallet.user_id == user.id)
        result = await db.execute(stmt)
        wallet = result.scalar_one_or_none()
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")

        if wallet.stable_coin_balance < Decimal(data.stable_amount):
            raise HTTPException(status_code=400, detail="Insufficient stable coin balance")

        # 1. Rate is local ← stable, so invert fetch if needed
        local_currency = wallet.local_currency.value  # e.g. "NGN"
        rate = await fetch_exchange_rate("USDC", local_currency)  # how many NGN per 1 USDC

        local_amt = Decimal(data.stable_amount) * Decimal(rate)

        # 2. Debit stable coin
        wallet.stable_coin_balance -= Decimal(data.stable_amount)
        await db.commit()
        await db.refresh(wallet)

        # 3. Add ledger entry
        ledger = WalletLedger(
            wallet_id=wallet.id,
            type=LedgerType.WITHDRAWAL,
            stable_amount=Decimal(data.stable_amount),
            local_amount=local_amt,
            local_currency=local_currency,
            exchange_rate=Decimal(rate)
        )
        db.add(ledger)
        await db.commit()

        # 4. Invalidate cache
        balance_cache_key = f"wallet_balance:{user.id}"
        await redis.delete(balance_cache_key)

        return await WalletService.get_balance(user, db, redis)

    @staticmethod
    async def get_balance(
        user: AuthenticatedUser,
        db: AsyncSession,
        redis: Redis
    ) -> WalletBalance:
        """
        Returns:
         - stable_coin_balance
         - local_currency
         - local_currency_balance = stable_coin_balance * rate
        Uses Redis cache for performance.
        """
        cache_key = f"wallet_balance:{user.id}"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(f"🔄 Using cached balance for user {user.id}")
            return WalletBalance.model_validate(cached)

        # 1. Fetch wallet
        stmt = select(Wallet).where(Wallet.user_id == user.id)
        result = await db.execute(stmt)
        wallet = result.scalar_one_or_none()
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")

        # 2. Fetch current rate local ↔ stable
        rate = await fetch_exchange_rate("USDC", wallet.local_currency.value)

        # 3. Compute local balance
        stable_bal = Decimal(wallet.stable_coin_balance)
        local_bal = stable_bal * Decimal(rate)

        balance = WalletBalance(
            stable_coin_balance=float(stable_bal),
            local_currency=wallet.local_currency.value,
            local_currency_balance=float(local_bal),
            as_of=datetime.now()
        )

        # 4. Cache the result
        await update_cache(cache_key, balance.model_dump(mode="json"), ttl=300)
        return balance

    @staticmethod
    async def get_wallet(
        db: AsyncSession,
        user: AuthenticatedUser,
        redis: Redis
    ) -> WalletDetail:
        """
        Returns:
         - Wallet details
        Uses Redis cache for performance.
        """
        cache_key = f"wallet_detail:{user.id}"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(f"🔄 Using cached wallet for user {user.id}")
            return WalletBalance.model_validate(cached)


        logger.info(f"📬 Fetching wallet from db for {user.id}")
        # 1. Fetch wallet
        stmt = select(Wallet).where(Wallet.user_id == user.id)
        result = await db.execute(stmt)
        wallet = result.scalars().first()
        if not wallet:
            logger.info(f"📬 Wallet not found for {user.id}. Creating wallet...\n")
            wallet = await WalletService.create_user_wallet(
                user, db
            )
            if not wallet:
                raise HTTPException(status_code=404, detail="Wallet not found")
          
        # 4. Cache the result
        wallet_data = WalletDetail.model_validate(wallet)
        await update_cache(cache_key, wallet_data.model_dump_json(), ttl=300)
        return wallet_data
    
    # @staticmethod
    # async def get_wallet_by_id(db: AsyncSession, user: UUID) -> UserDetail | None:
    #     """
    #     Fetch a single user by ID.
    #     """
    #     try:
    #         result = await db.execute(select(User).where(User.id == user_id))
    #         user = result.scalars().first()
    #         if not user:
    #             raise HTTPException(status_code=404, detail="User not found")
    #         return user
    #     except Exception as e:
    #         logger.error(f"Failed to fetch user by ID: {e}")
    #         raise HTTPException(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             detail="Could not fetch user"
    #         )
