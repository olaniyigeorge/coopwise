from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas.contribution_schemas import ContributionCreate, ContributionDetail
from app.services.membership_service import CooperativeMembershipService
from app.schemas.auth import AuthenticatedUser
from db.models.contribution_model import Contribution
from app.utils.logger import logger
from config import AppConfig as config
from fastapi import HTTPException, status
from app.services.contract_service import contract_service
from app.services.wallet_service import WalletService
from decimal import Decimal


class ContributionService:

    @staticmethod
    async def process_manual_contribution(
        contribution_data: ContributionCreate,
        user: AuthenticatedUser,
        db: AsyncSession,
        network: str = "flow"
    ) -> ContributionDetail:
        """
        Process a manual contribution initiated by the user.
        Handles wallet locking, onchain submission, and status updates.
        """
        # Validate membership
        membership = await CooperativeMembershipService.get_membership_by_user_and_group(
            user_id=user.id, group_id=contribution_data.group_id, db=db
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this cooperative group.",
            )

        # Check wallet balance
        wallet_balance = await WalletService.get_balance(user.id, db)
        if wallet_balance.stable_coin_balance < Decimal(str(contribution_data.amount)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient wallet balance for contribution.",
            )

        # Lock funds in wallet
        lock_result = await WalletService.lock_for_contribution(
            user_id=user.id,
            amount=Decimal(str(contribution_data.amount)),
            db=db
        )
        if not lock_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to lock funds in wallet.",
            )

        # Create contribution record with initiated status
        contribution_data.status = ContributionStatus.initiated
        contribution = Contribution(
            group_id=contribution_data.group_id,
            user_id=user.id,
            amount=contribution_data.amount,
            currency=contribution_data.currency,
            due_date=contribution_data.due_date,
            note=f"Manual contribution - {contribution_data.note or ''}",
            status=contribution_data.status,
        )

        db.add(contribution)
        await db.commit()
        await db.refresh(contribution)

        # Submit to smart contract
        contract_result = await contract_service.submit_contribution_onchain(
            group_id=contribution_data.group_id,
            contribution_id=contribution.id,
            amount=Decimal(str(contribution_data.amount)),
            user_address=user.wallet_address or str(user.id),  # Assuming user has wallet_address
            network=network
        )

        if contract_result["success"]:
            # Finalize the contribution
            await ContributionService.mark_contribution_success(
                db=db,
                contribution_id=contribution.id,
                tx_hash=contract_result.get("tx_hash")
            )
        else:
            # Revert wallet lock and mark as failed
            await WalletService.release_locked_funds(
                user_id=user.id,
                amount=Decimal(str(contribution_data.amount)),
                db=db
            )
            await ContributionService.mark_contribution_failed(
                db=db,
                contribution_id=contribution.id,
                reason=contract_result.get("error", "Contract submission failed")
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to submit contribution to smart contract.",
            )

        return contribution

    @staticmethod
    async def process_auto_debit(
        group_id: UUID,
        user: AuthenticatedUser,
        db: AsyncSession,
        network: str = "flow"
    ) -> ContributionDetail:
        """
        Process an automated debit based on group policy and user wallet balance.
        """
        # Get group details
        from app.services.cooperative_group_service import CooperativeGroupService
        group = await CooperativeGroupService.get_coop_group_by_id(db, group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cooperative group not found.",
            )

        # Validate membership
        membership = await CooperativeMembershipService.get_membership_by_user_and_group(
            user_id=user.id, group_id=group_id, db=db
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this cooperative group.",
            )

        # Check if contribution is due (simplified - in production, check against schedule)
        # For now, assume it's due if called

        # Check wallet balance
        wallet_balance = await WalletService.get_balance(user.id, db)
        if wallet_balance.stable_coin_balance < group.contribution_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient wallet balance for automated contribution.",
            )

        # Lock funds
        lock_result = await WalletService.lock_for_contribution(
            user_id=user.id,
            amount=group.contribution_amount,
            db=db
        )
        if not lock_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to lock funds for automated contribution.",
            )

        # Create contribution record
        contribution = Contribution(
            group_id=group_id,
            user_id=user.id,
            amount=group.contribution_amount,
            currency="NGN",  # Assuming default
            status=ContributionStatus.initiated,
            note="Automated debit contribution",
        )

        db.add(contribution)
        await db.commit()
        await db.refresh(contribution)

        # Submit to smart contract
        contract_result = await contract_service.submit_contribution_onchain(
            group_id=group_id,
            contribution_id=contribution.id,
            amount=group.contribution_amount,
            user_address=user.wallet_address or str(user.id),
            network=network
        )

        if contract_result["success"]:
            await ContributionService.mark_contribution_success(
                db=db,
                contribution_id=contribution.id,
                tx_hash=contract_result.get("tx_hash")
            )
        else:
            await WalletService.release_locked_funds(
                user_id=user.id,
                amount=group.contribution_amount,
                db=db
            )
            await ContributionService.mark_contribution_failed(
                db=db,
                contribution_id=contribution.id,
                reason=contract_result.get("error", "Auto-debit failed")
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Automated contribution failed.",
            )

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

    @staticmethod
    async def mark_contribution_success(
        db: AsyncSession,
        contribution_id: UUID,
        tx_hash: str = None
    ) -> dict:
        """
        Mark a contribution as successfully completed.
        """
        try:
            contribution = await db.get(Contribution, contribution_id)
            if not contribution:
                raise HTTPException(status_code=404, detail="Contribution not found")

            contribution.status = ContributionStatus.completed
            contribution.fulfilled_at = datetime.now()
            if tx_hash:
                contribution.note = f"{contribution.note or ''} - TX: {tx_hash}"

            await db.commit()
            await db.refresh(contribution)

            # Finalize wallet debit
            await WalletService.finalize_contribution_debit(
                user_id=contribution.user_id,
                amount=Decimal(str(contribution.amount)),
                db=db
            )

            return {
                "message": "Contribution marked as completed successfully."
            }

        except Exception as e:
            logger.error(f"Failed to mark contribution success: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not mark contribution as completed",
            )

    @staticmethod
    async def mark_contribution_failed(
        db: AsyncSession,
        contribution_id: UUID,
        reason: str
    ) -> dict:
        """
        Mark a contribution as failed and revert wallet changes.
        """
        try:
            contribution = await db.get(Contribution, contribution_id)
            if not contribution:
                raise HTTPException(status_code=404, detail="Contribution not found")

            contribution.status = ContributionStatus.failed
            contribution.note = f"{contribution.note or ''} - FAILED: {reason}"

            await db.commit()
            await db.refresh(contribution)

            return {
                "message": "Contribution marked as failed."
            }

        except Exception as e:
            logger.error(f"Failed to mark contribution failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not mark contribution as failed",
            )
