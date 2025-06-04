# Log contributions manually/automatically.

# Validate against group rules (amount, schedule).

# Calculate group savings status.

from datetime import datetime
from decimal import Decimal
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas.wallet_schemas import WalletWithdraw
from app.services.wallet_service import WalletService
from app.utils.exchange_client import fetch_exchange_rate
from app.schemas.contribution_schemas import ContributionCreate, ContributionDetail
from app.services.membership_service import CooperativeMembershipService
from app.schemas.auth import AuthenticatedUser
from db.models.contribution_model import Contribution
from app.utils.logger import logger
from app.core.config import config
from fastapi import HTTPException, status


class ContributionService:


    @staticmethod
    async def make_contribution(contribution_data: ContributionCreate, user:AuthenticatedUser, db: AsyncSession) -> ContributionDetail:
        """
        Makes a contribution to a cooperative group. 
        """

        # Check if user is a member of the cooperative group
        membership = await CooperativeMembershipService.get_membership_by_user_and_group(
            user_id=user.id, group_id=contribution_data.group_id, db=db
        )
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this cooperative group."
            )

        # Create contribution record
        contribution = Contribution(
            group_id=contribution_data.group_id,
            user_id=user.id,
            amount=contribution_data.amount,
            currency=contribution_data.currency,
            due_date=contribution_data.due_date or None,
            note=contribution_data.note or None,
            status=contribution_data.status,
           
        )

        db.add(contribution)
        await db.commit()
        await db.refresh(contribution)

        logger.info(f"Contribution made successfully: {contribution}")

        return contribution

    @staticmethod
    async def pay_contribution(
        user: AuthenticatedUser,
        data: ContributionCreate,
        db: AsyncSession,
        redis: Redis
    ):
        """
        1. Convert local → stable and debit user's wallet.
        2. Create ledger entry (handled in WalletService).
        3. Mark contribution in GroupMembership or Contribution table.
        """
        # 1. Debit wallet in stable coin
        #    Deposit of local→stable handled in wallet_service
        #    For contribution, we reuse withdraw (in stable), but user sends local currency
        rate = await fetch_exchange_rate(data.currency, "USDC")
        stable_amt = Decimal(data.local_amount) * Decimal(rate)

        # Ensure user has enough balance (or top up if needed)
        balance = await WalletService.get_balance(user, db, redis)
        if balance.stable_coin_balance < stable_amt:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance.")

        # 2. Debit wallet in stable
        await WalletService.withdraw(
            user,
            WalletWithdraw(stable_amount=float(stable_amt)),
            db,
            redis
        )

        # 3. Mark contribution as paid
        #    e.g. create a Contribution record, increment group pool, etc.
        contribution = Contribution(
            user_id=user.id,
            group_id=data.group_id,
            amount_in_local=Decimal(data.local_amount),
            amount_in_stable=stable_amt,
            currency=data.currency,
            paid_at=datetime.now()
        )
        db.add(contribution)
        await db.commit()
        await db.refresh(contribution)

        return {"detail": "Contribution paid successfully."}






