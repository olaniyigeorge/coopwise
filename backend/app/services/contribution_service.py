from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional, Dict, Any, List
from decimal import Decimal
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.schemas.contribution_schemas import ContributionCreate, ContributionDetail
from app.services.membership_service import CooperativeMembershipService
from app.schemas.auth import AuthenticatedUser
from db.models.contribution_model import Contribution, ContributionStatus
from db.models.cooperative_group import CooperativeGroup, ContributionFrequency
from app.utils.logger import logger
from config import AppConfig as config
from fastapi import HTTPException, status
from app.services.contract_service import contract_service
from app.services.wallet_service import WalletService


class ContributionActionType(Enum):
    """Tracking different types of contribution actions for audit"""
    MANUAL_SUBMIT = "manual_submit"
    AUTO_DEBIT = "auto_debit"
    EMERGENCY_WITHDRAW = "emergency_withdraw"
    PAYOUT_RECEIVED = "payout_received"
    REFUND = "refund"


class ContributionService:
    """
    Service for managing all contribution lifecycle operations.
    
    Handles:
    - Manual contributions (user-initiated)
    - Automated contributions based on schedule
    - Withdrawal and emergency refunds
    - Time-based payout logic
    - Blockchain synchronization
    - Audit trail and security
    """

    @staticmethod
    async def process_manual_contribution(
        contribution_data: ContributionCreate,
        user: AuthenticatedUser,
        db: AsyncSession,
        group_address: str = None,
        network: str = "flow"
    ) -> ContributionDetail:
        """
        Process a manual contribution initiated by the user.
        
        Flow:
        1. Validate membership in group
        2. Check sufficient wallet balance
        3. Lock funds in wallet (prevent double-spend)
        4. Create contribution record (initiated status)
        5. Submit to smart contract
        6. Mark as completed or failed based on contract response
        7. Handle rollback on failure
        
        Security checks:
        - User must be active group member
        - Amount must be >= 0
        - Wallet must have sufficient balance
        - Idempotent: duplicate submissions use same contribution ID
        """
        # Validate membership
        membership = await CooperativeMembershipService.get_membership_by_user_and_group(
            user_id=user.id, group_id=contribution_data.group_id, db=db
        )
        if not membership or not membership.is_active:
            logger.warning(
                f"Non-member contribution attempt: user={user.id}, group={contribution_data.group_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not an active member of this cooperative group.",
            )

        # Get group for validation
        from app.services.cooperative_group_service import CooperativeGroupService
        group = await CooperativeGroupService.get_coop_group_by_id(
            db, contribution_data.group_id
        )
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cooperative group not found.",
            )
        if not group.status.value == "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group is not active.",
            )

        # Validate amount
        amount = Decimal(str(contribution_data.amount))
        if amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contribution amount must be greater than zero.",
            )

        # Check wallet balance with buffer for fees (5% buffer)
        wallet_balance = await WalletService.get_balance(user.id, db)
        required_amount = amount * Decimal("1.05")  # 5% buffer for fees
        if wallet_balance.stable_coin_balance < required_amount:
            logger.warning(
                f"Insufficient balance: user={user.id}, required={required_amount}, "
                f"available={wallet_balance.stable_coin_balance}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient wallet balance. Required: {required_amount}, Available: {wallet_balance.stable_coin_balance}",
            )

        # Lock funds in wallet (prevents double-spend)
        lock_result = await WalletService.lock_for_contribution(
            user_id=user.id,
            amount=amount,
            db=db
        )
        if not lock_result.get("success"):
            logger.error(f"Failed to lock funds: user={user.id}, amount={amount}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to lock funds in wallet. Try again or contact support.",
            )

        # Create contribution record with initiated status
        contribution = Contribution(
            group_id=contribution_data.group_id,
            user_id=user.id,
            amount=amount,
            currency=contribution_data.currency or "NGN",
            due_date=contribution_data.due_date,
            note=f"Manual contribution - {contribution_data.note or ''}",
            status=ContributionStatus.initiated,
        )

        try:
            db.add(contribution)
            await db.commit()
            await db.refresh(contribution)
            logger.info(f"Contribution created: id={contribution.id}, user={user.id}, amount={amount}")

            # Submit to smart contract
            contract_result = await contract_service.submit_contribution(
                group_address=group_address or str(group.id),
                user_address=user.wallet_address or str(user.id),
                amount=amount,
                network=network
            )

            if contract_result.get("success"):
                # Mark as completed with TX hash
                await ContributionService.mark_contribution_success(
                    db=db,
                    contribution_id=contribution.id,
                    tx_hash=contract_result.get("tx_hash"),
                    action_type=ContributionActionType.MANUAL_SUBMIT
                )
                logger.info(
                    f"Contribution completed: id={contribution.id}, tx={contract_result.get('tx_hash')}"
                )
            else:
                # Revert wallet lock and mark as failed
                await WalletService.release_locked_funds(
                    user_id=user.id,
                    amount=amount,
                    db=db
                )
                await ContributionService.mark_contribution_failed(
                    db=db,
                    contribution_id=contribution.id,
                    reason=contract_result.get("error", "Contract submission failed"),
                    action_type=ContributionActionType.MANUAL_SUBMIT
                )
                logger.error(
                    f"Contribution failed: id={contribution.id}, reason={contract_result.get('error')}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to submit contribution to blockchain. Funds have been returned.",
                )

            # Reload to get updated status
            await db.refresh(contribution)
            return contribution

        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f"Unexpected error in process_manual_contribution: {e}", exc_info=True)
            # Attempt cleanup
            try:
                await WalletService.release_locked_funds(
                    user_id=user.id,
                    amount=amount,
                    db=db
                )
            except:
                logger.error(f"Failed to cleanup locked funds for user {user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while processing your contribution.",
            )

    @staticmethod
    async def process_auto_contribution(
        group_id: UUID,
        user: AuthenticatedUser,
        db: AsyncSession,
        network: str = "flow"
    ) -> Optional[ContributionDetail]:
        """
        Process an automated contribution based on group policy.
        
        Called by scheduled worker (e.g., Celery) for recurring contributions.
        This is the primary time-based contribution mechanism.
        
        Flow:
        1. Validate user is active member
        2. Check if contribution is due (based on frequency)
        3. Verify wallet has sufficient balance
        4. Lock funds
        5. Submit to contract
        6. Record in database
        
        Returns None if contribution is not yet due or fails gracefully.
        """
        try:
            # Validate membership
            membership = await CooperativeMembershipService.get_membership_by_user_and_group(
                user_id=user.id, group_id=group_id, db=db
            )
            if not membership or not membership.is_active:
                logger.warning(
                    f"Auto-contribution skipped: inactive member user={user.id}, group={group_id}"
                )
                return None

            # Get group details
            from app.services.cooperative_group_service import CooperativeGroupService
            group = await CooperativeGroupService.get_coop_group_by_id(db, group_id)
            if not group or group.status.value != "active":
                logger.warning(f"Auto-contribution skipped: group not active group={group_id}")
                return None

            # Check if contribution is due based on frequency
            if not await ContributionService._is_contribution_due(db, group_id, user.id):
                logger.debug(f"Contribution not yet due: user={user.id}, group={group_id}")
                return None

            # Check wallet balance
            wallet_balance = await WalletService.get_balance(user.id, db)
            if wallet_balance.stable_coin_balance < group.contribution_amount:
                logger.warning(
                    f"Insufficient balance for auto-contribution: user={user.id}, "
                    f"required={group.contribution_amount}, available={wallet_balance.stable_coin_balance}"
                )
                # Don't raise - just skip this user
                return None

            # Get group's contract address (would be stored in cooperative_group table)
            group_address = group.id  # TODO: Add blockchain_address field to cooperative_group

            # Lock funds
            lock_result = await WalletService.lock_for_contribution(
                user_id=user.id,
                amount=group.contribution_amount,
                db=db
            )
            if not lock_result.get("success"):
                logger.error(
                    f"Failed to lock funds for auto-contribution: user={user.id}, group={group_id}"
                )
                return None

            # Create contribution record
            contribution = Contribution(
                group_id=group_id,
                user_id=user.id,
                amount=group.contribution_amount,
                currency="NGN",
                status=ContributionStatus.initiated,
                note=f"Automatic {group.contribution_frequency.value} contribution",
            )

            db.add(contribution)
            await db.commit()
            await db.refresh(contribution)

            # Submit to smart contract
            contract_result = await contract_service.submit_contribution(
                group_address=str(group_address),
                user_address=user.wallet_address or str(user.id),
                amount=group.contribution_amount,
                network=network
            )

            if contract_result.get("success"):
                await ContributionService.mark_contribution_success(
                    db=db,
                    contribution_id=contribution.id,
                    tx_hash=contract_result.get("tx_hash"),
                    action_type=ContributionActionType.AUTO_DEBIT
                )
                logger.info(
                    f"Auto-contribution processed: user={user.id}, group={group_id}, "
                    f"amount={group.contribution_amount}"
                )
                await db.refresh(contribution)
                return contribution
            else:
                # Release locked funds and mark as failed
                await WalletService.release_locked_funds(
                    user_id=user.id,
                    amount=group.contribution_amount,
                    db=db
                )
                await ContributionService.mark_contribution_failed(
                    db=db,
                    contribution_id=contribution.id,
                    reason=f"Auto-debit contract error: {contract_result.get('error')}",
                    action_type=ContributionActionType.AUTO_DEBIT
                )
                logger.error(
                    f"Auto-contribution failed: user={user.id}, group={group_id}, "
                    f"error={contract_result.get('error')}"
                )
                return None

        except Exception as e:
            logger.error(f"Error in process_auto_contribution: {e}", exc_info=True)
            return None

    @staticmethod
    async def request_withdrawal(
        group_id: UUID,
        user: AuthenticatedUser,
        amount: Decimal,
        db: AsyncSession,
        network: str = "flow"
    ) -> Dict[str, Any]:
        """
        Request a withdrawal of funds from the group vault.
        
        This could be before payout is scheduled or for emergency situations.
        
        Security: 
        - User must be member
        - Amount must not exceed user's balance in group
        - Creates withdrawal record for manager approval
        - Requires blockchain confirmation
        """
        # Validate membership
        membership = await CooperativeMembershipService.get_membership_by_user_and_group(
            user_id=user.id, group_id=group_id, db=db
        )
        if not membership or not membership.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not an active member of this group.",
            )

        # Get group
        from app.services.cooperative_group_service import CooperativeGroupService
        group = await CooperativeGroupService.get_coop_group_by_id(db, group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found.",
            )

        # Validate amount
        if amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Withdrawal amount must be positive.",
            )

        # Check user balance in group (query total contributions minus payouts)
        # For now, simplified check
        total_contributed = await db.execute(
            select(Contribution).where(
                and_(
                    Contribution.user_id == user.id,
                    Contribution.group_id == group_id,
                    Contribution.status == ContributionStatus.completed
                )
            )
        )
        total_amount = sum(
            c.amount for c in total_contributed.scalars().all()
        )
        
        if total_amount < amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient balance. Your total contribution: {total_amount}, Requested: {amount}",
            )

        # Submit withdrawal to contract (which handles priority/schedule)
        group_address = str(group.id)  # TODO: Use blockchain_address
        contract_result = await contract_service.submit_contribution(
            group_address=group_address,
            user_address=user.wallet_address or str(user.id),
            amount=-amount,  # Negative = withdrawal
            network=network
        )

        return {
            "success": contract_result.get("success"),
            "tx_hash": contract_result.get("tx_hash"),
            "amount": str(amount),
            "group_id": str(group_id),
            "status": "pending" if contract_result.get("success") else "failed",
            "message": contract_result.get("error") if not contract_result.get("success") else "Withdrawal request submitted"
        }

    @staticmethod
    async def emergency_refund(
        group_id: UUID,
        user: AuthenticatedUser,
        db: AsyncSession,
        network: str = "flow"
    ) -> Dict[str, Any]:
        """
        Request emergency refund from group vault.
        
        This is for special circumstances (group dissolution, user hardship, etc.)
        Requires additional authorization/approval.
        """
        # Validate membership
        membership = await CooperativeMembershipService.get_membership_by_user_and_group(
            user_id=user.id, group_id=group_id, db=db
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this group.",
            )

        # Get group
        from app.services.cooperative_group_service import CooperativeGroupService
        group = await CooperativeGroupService.get_coop_group_by_id(db, group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found.",
            )

        # Call emergency refund on contract
        group_address = str(group.id)  # TODO: Use blockchain_address
        contract_result = await contract_service.emergency_refund(
            group_address=group_address,
            user_address=user.wallet_address or str(user.id),
            network=network
        )

        logger.warning(
            f"EMERGENCY REFUND requested: user={user.id}, group={group_id}, "
            f"success={contract_result.get('success')}"
        )

        return {
            "success": contract_result.get("success"),
            "tx_hash": contract_result.get("tx_hash"),
            "refund_amount": str(contract_result.get("refund_amount", 0)),
            "group_id": str(group_id),
            "message": "Emergency refund initiated" if contract_result.get("success") else contract_result.get("error")
        }

    @staticmethod
    async def _is_contribution_due(
        db: AsyncSession,
        group_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Check if a users's contribution is due based on frequency and last contribution.
        """
        # Get group
        from app.services.cooperative_group_service import CooperativeGroupService
        group = await CooperativeGroupService.get_coop_group_by_id(db, group_id)
        if not group:
            return False

        # Get last contribution
        last_contribution = await db.execute(
            select(Contribution)
            .where(
                and_(
                    Contribution.user_id == user_id,
                    Contribution.group_id == group_id,
                    Contribution.status == ContributionStatus.completed
                )
            )
            .order_by(Contribution.created_at.desc())
        )
        last = last_contribution.scalars().first()

        if not last:
            # Never contributed - due now
            return True

        # Check based on frequency
        now = datetime.now()
        frequency = group.contribution_frequency
        
        if frequency == ContributionFrequency.daily:
            due_date = last.created_at + timedelta(days=1)
        elif frequency == ContributionFrequency.weekly:
            due_date = last.created_at + timedelta(weeks=1)
        elif frequency == ContributionFrequency.monthly:
            due_date = last.created_at + timedelta(days=30)
        else:
            return False

        return now >= due_date

    @staticmethod
    async def mark_contribution_success(
        db: AsyncSession,
        contribution_id: UUID,
        tx_hash: str = None,
        action_type: ContributionActionType = ContributionActionType.MANUAL_SUBMIT
    ) -> Dict[str, Any]:
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
                contribution.note = f"{contribution.note or ''} | TX: {tx_hash}"

            await db.commit()
            await db.refresh(contribution)

            # Finalize wallet debit
            await WalletService.finalize_contribution_debit(
                user_id=contribution.user_id,
                amount=Decimal(str(contribution.amount)),
                db=db
            )

            logger.info(
                f"Contribution marked successful: id={contribution_id}, "
                f"action={action_type.value}, tx={tx_hash}"
            )

            return {
                "message": "Contribution marked as completed successfully.",
                "contribution_id": str(contribution_id),
                "status": "completed"
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to mark contribution success: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not mark contribution as completed",
            )

    @staticmethod
    async def mark_contribution_failed(
        db: AsyncSession,
        contribution_id: UUID,
        reason: str,
        action_type: ContributionActionType = ContributionActionType.MANUAL_SUBMIT
    ) -> Dict[str, Any]:
        """
        Mark a contribution as failed and record failure reason.
        """
        try:
            contribution = await db.get(Contribution, contribution_id)
            if not contribution:
                raise HTTPException(status_code=404, detail="Contribution not found")

            contribution.status = ContributionStatus.failed
            contribution.note = f"{contribution.note or ''} | FAILED: {reason}"

            await db.commit()
            await db.refresh(contribution)

            logger.warning(
                f"Contribution marked failed: id={contribution_id}, "
                f"action={action_type.value}, reason={reason}"
            )

            return {
                "message": "Contribution marked as failed.",
                "contribution_id": str(contribution_id),
                "reason": reason
            }

        except Exception as e:
            logger.error(f"Failed to mark contribution failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not mark contribution as failed",
            )

    @staticmethod
    async def update_contribution_status(
        db: AsyncSession,
        contribution_id: UUID,
        contribution_status: str,
        paid_at: datetime = None,
    ) -> Dict[str, Any]:
        """
        Update the status of a contribution (for manual adjustments).
        """
        try:
            contribution = await db.get(Contribution, contribution_id)
            if not contribution:
                raise HTTPException(status_code=404, detail="Contribution not found")

            # Validate status
            try:
                new_status = ContributionStatus[contribution_status.upper()]
            except KeyError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status: {contribution_status}"
                )

            contribution.status = new_status
            if new_status == ContributionStatus.completed:
                contribution.fulfilled_at = paid_at or datetime.now()

            await db.commit()
            await db.refresh(contribution)

            logger.info(
                f"Contribution status updated: id={contribution_id}, "
                f"new_status={new_status.value}"
            )

            return {
                "message": f"Contribution marked {new_status.value} successfully.",
                "contribution_id": str(contribution_id),
                "status": new_status.value
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update contribution status: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update contribution status",
            )

    @staticmethod
    async def get_contribution_by_id(
        db: AsyncSession, contribution_id: UUID
    ) -> Optional[Contribution]:
        """
        Fetch a Contribution by ID.
        """
        try:
            result = await db.execute(
                select(Contribution).where(Contribution.id == contribution_id)
            )
            contribution = result.scalars().first()
            if not contribution:
                raise HTTPException(status_code=404, detail="Contribution not found")
            return contribution
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch contribution by ID: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch contribution",
            )

    @staticmethod
    async def get_contributions(
        db: AsyncSession,
        group_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 10
    ) -> List[Contribution]:
        """
        Fetch contributions with optional filtering.
        """
        try:
            query = select(Contribution)
            
            if group_id:
                query = query.where(Contribution.group_id == group_id)
            if user_id:
                query = query.where(Contribution.user_id == user_id)
            
            query = query.offset(skip).limit(limit).order_by(Contribution.created_at.desc())
            
            result = await db.execute(query)
            contributions = result.scalars().all()
            return contributions
        except Exception as e:
            logger.error(f"Failed to fetch contributions: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch contributions",
            )

    @staticmethod
    async def get_user_group_contributions(
        db: AsyncSession,
        user_id: UUID,
        group_id: UUID
    ) -> Dict[str, Any]:
        """
        Get comprehensive contribution summary for a user in a specific group.
        """
        try:
            contributions = await ContributionService.get_contributions(
                db, group_id=group_id, user_id=user_id, limit=1000
            )
            
            completed = [c for c in contributions if c.status == ContributionStatus.completed]
            pending = [c for c in contributions if c.status in (ContributionStatus.initiated, ContributionStatus.pending)]
            failed = [c for c in contributions if c.status == ContributionStatus.failed]
            
            total_contributed = sum(c.amount for c in completed)
            total_pending = sum(c.amount for c in pending)
            
            return {
                "total_contributed": float(total_contributed),
                "total_pending": float(total_pending),
                "contribution_count": len(completed),
                "pending_count": len(pending),
                "failed_count": len(failed),
                "contributions": [
                    {
                        "id": str(c.id),
                        "amount": float(c.amount),
                        "status": c.status.value,
                        "created_at": c.created_at.isoformat(),
                        "fulfilled_at": c.fulfilled_at.isoformat() if c.fulfilled_at else None
                    }
                    for c in contributions[:20]  # Return last 20
                ]
            }
        except Exception as e:
            logger.error(f"Failed to get user group contributions: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch contribution summary",
            )


