from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas.contribution_schemas import ContributionCreate, ContributionDetail
from app.services.membership_service import CooperativeMembershipService
from app.schemas.auth import AuthenticatedUser
from app.services.activity_service import ActivityService
from app.schemas.activity_schemas import ActivityCreate
from db.models.activity_model import ActivityType
from db.models.contribution_model import Contribution
from app.utils.logger import logger
from app.core.config import config
from fastapi import HTTPException, status


class ContributionService:

    @staticmethod
    async def make_contribution(
        contribution_data: ContributionCreate, user: AuthenticatedUser, db: AsyncSession
    ) -> ContributionDetail:
        """
        Creates a contribution to a cooperative group with provided data.
        """

        # Check if user is a member of the cooperative group
        membership = (
            await CooperativeMembershipService.get_membership_by_user_and_group(
                user_id=user.id, group_id=contribution_data.group_id, db=db
            )
        )

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this cooperative group.",
            )

        # Create contribution record

        logger.info("Contribution status being saved:", contribution_data.status.value)
        contribution = Contribution(
            group_id=contribution_data.group_id,
            user_id=user.id,
            amount=contribution_data.amount,
            currency=contribution_data.currency,
            due_date=contribution_data.due_date or None,
            note=contribution_data.note or None,
            status=contribution_data.status.value,
        )

        db.add(contribution)
        await db.commit()
        await db.refresh(contribution)

        # Log activity for the contribution
        try:
            activity_data = ActivityCreate(
                user_id=user.id,
                type=ActivityType.made_contribution.value,
                description=f"Made a contribution of {contribution_data.currency}{contribution_data.amount} to the savings group",
                group_id=contribution_data.group_id,
                entity_id=str(contribution.id),
                amount=contribution_data.amount,
            )
            await ActivityService.log(db, activity_data)
        except Exception as e:
            logger.error(f"Failed to log contribution activity: {e}")
            # Don't fail the contribution if activity logging fails

        logger.info(f"Contribution made successfully: {contribution}")

        return contribution

    @staticmethod
    async def update_contribution_status(
        db: AsyncSession,
        contribution_id: UUID,
        contribution_status: str,
        paid_at: datetime,
    ) -> dict:
        """
        Update the status of a contribution.
        """
        try:
            contribution = await db.get(Contribution, contribution_id)
            if not contribution:
                raise HTTPException(status_code=404, detail="Contribution not found")

            contribution.status = contribution_status
            contribution.fulfilled_at = (
                datetime.now() if contribution_status == "completed" else None
            )
            await db.commit()
            await db.refresh(contribution)

            return {
                "message": f"Contribution marked {contribution_status} successfully."
            }

        except Exception as e:
            logger.error(f"Failed to update contribution status: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update contribution status",
            )

    # @staticmethod
    # async def pay_contribution(
    #     user: AuthenticatedUser,
    #     data: ContributionCreate,
    #     db: AsyncSession,
    #     redis: Redis
    # ):
    #     """
    #     1. Convert local → stable and debit user's wallet.
    #     2. Create ledger entry (handled in WalletService).
    #     3. Mark contribution in GroupMembership or Contribution table.
    #     """
    #     # 1. Debit wallet in stable coin
    #     #    Deposit of local→stable handled in wallet_service
    #     #    For contribution, we reuse withdraw (in stable), but user sends local currency
    #     rate = await fetch_exchange_rate(data.currency, "USDC")
    #     stable_amt = Decimal(data.local_amount) * Decimal(rate)

    #     # Ensure user has enough balance (or top up if needed)
    #     balance = await WalletService.get_balance(user, db, redis)
    #     if balance.stable_coin_balance < stable_amt:
    #         raise HTTPException(status_code=400, detail="Insufficient wallet balance.")

    #     # 2. Debit wallet in stable
    #     await WalletService.withdraw(
    #         user,
    #         WalletWithdraw(stable_amount=float(stable_amt)),
    #         db,
    #         redis
    #     )

    #     # 3. Mark contribution as paid
    #     #    e.g. create a Contribution record, increment group pool, etc.
    #     contribution = Contribution(
    #         user_id=user.id,
    #         group_id=data.group_id,
    #         amount_in_local=Decimal(data.local_amount),
    #         amount_in_stable=stable_amt,
    #         currency=data.currency,
    #         paid_at=datetime.now()
    #     )
    #     db.add(contribution)
    #     await db.commit()
    #     await db.refresh(contribution)

    #     return {"detail": "Contribution paid successfully."}

    @staticmethod
    async def get_contribution_by_id(
        db: AsyncSession, contribution_id: UUID
    ) -> ContributionDetail | None:
        """
        Fetch a Contribntuon by ID.
        """
        try:
            result = await db.execute(
                select(Contribution).where(Contribution.id == contribution_id)
            )
            contribution = result.scalars().first()
            if not contribution:
                raise HTTPException(status_code=404, detail="Contribution not found")
            return contribution
        except Exception as e:
            logger.error(f"Failed to fetch contribution by ID: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch contribution",
            )

    @staticmethod
    async def get_contributions(
        db: AsyncSession, skip: int = 0, limit: int = 10
    ) -> list[ContributionDetail]:
        """
        Fetch a list of contributions with optional pagination.
        """
        try:
            result = await db.execute(select(Contribution).offset(skip).limit(limit))
            contributions = result.scalars().all()
        except Exception as e:
            logger.error(f"Failed to fetch contributions: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch contributions",
            )
        return contributions
