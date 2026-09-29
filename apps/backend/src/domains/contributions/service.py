from datetime import datetime, timedelta
from uuid import UUID, uuid4
from typing import Optional, Dict, Any, List
from decimal import Decimal
from enum import Enum
from src.domains.cooperatives.models.enums import ContributionFrequency
from fastapi import HTTPException, status

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from src.domains.contributions.schemas import ContributionCreate, ContributionDetail
from src.domains.memberships.service import CooperativeMembershipService
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.contributions.models import Contribution, ContributionStatus

from src.shared.utils.logger import logger
from src.domains.wallets.service import WalletService, MOCK_LOCAL_TO_STABLE_RATE
from src.shared.money import stable_to_local
from src.domains.cooperatives.uow import UnitOfWork
from src.domains.cooperatives.services.rule_services import FinancialRuleService
from src.domains.cooperatives.exceptions import RuleNotFoundError
from src.domains.cooperatives.models.goals import CoopGoal
from src.domains.analytics.service import ActivityService
from src.domains.analytics.schemas import ActivityCreate
from src.domains.analytics.models import ActivityType


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
    async def _validate_contribution_request(
        contribution_data: ContributionCreate,
        user: AuthenticatedUser,
        db: AsyncSession,
    ) -> Decimal:
        """
        Shared pre-flight checks for any user-initiated contribution (wallet
        or Paystack): active membership, active group, goal belongs to the
        group, positive amount. Returns the validated amount.
        """
        # Validate membership
        membership = (
            await CooperativeMembershipService.get_membership_by_user_and_group(
                user_id=user.id, group_id=contribution_data.group_id, db=db
            )
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
        from src.domains.cooperatives.services.cooperative_service import (
            CooperativeService,
        )

        group = await CooperativeService.get_coop_group_by_id(
            db, contribution_data.group_id
        )
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cooperative group not found.",
            )
        if not group.status == "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group is not active.",
            )

        # If a goal is targeted, it must belong to this group
        if contribution_data.goal_id:
            goal = await db.get(CoopGoal, contribution_data.goal_id)
            if not goal or goal.cooperative_id != contribution_data.group_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Goal not found in this cooperative.",
                )

        # Validate amount
        amount = Decimal(str(contribution_data.amount))
        if amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contribution amount must be greater than zero.",
            )
        return amount

    @staticmethod
    async def process_manual_contribution(
        contribution_data: ContributionCreate,
        user: AuthenticatedUser,
        db: AsyncSession,
    ) -> ContributionDetail:
        """
        Process a manual contribution initiated by the user.

        Web2 flow (no blockchain — see project notes: Flow/Crossmint wallet
        integration is deliberately deferred until after the Web2 path ships):
        1. Validate membership in group (and goal, if one is targeted)
        2. Check sufficient wallet balance
        3. Lock funds in wallet (prevent double-spend)
        4. Create contribution record (initiated status)
        5. Finalize the wallet debit and mark completed
        6. Handle rollback on failure

        Security checks:
        - User must be active group member
        - Amount must be >= 0
        - Wallet must have sufficient balance
        - Idempotent: duplicate submissions use same contribution ID
        """
        amount = await ContributionService._validate_contribution_request(
            contribution_data, user, db
        )

        # wallet.stable_coin_balance is denominated in stable-coin units, not
        # the contribution's local currency — convert before comparing/locking
        # (same mock rate deposits use to credit the wallet in the first
        # place), or a funded wallet still reads as "insufficient" forever.
        stable_amount = amount * MOCK_LOCAL_TO_STABLE_RATE

        # Check wallet balance with buffer for fees (5% buffer)
        wallet_balance = await WalletService.get_effective_balance(user.id, db)
        required_amount = stable_amount * Decimal("1.05")  # 5% buffer for fees
        if wallet_balance < required_amount:
            logger.warning(
                f"Insufficient balance: user={user.id}, required={required_amount}, "
                f"available={wallet_balance}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient wallet balance. You need "
                    f"{contribution_data.currency or 'NGN'} {stable_to_local(required_amount):,.2f} "
                    f"(including a 5% fee buffer) but have "
                    f"{stable_to_local(wallet_balance):,.2f} available."
                ),
            )

        # Lock funds in wallet (prevents double-spend)
        lock_result = await WalletService.lock_for_contribution(
            user_id=user.id, amount=stable_amount, db=db
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
            goal_id=contribution_data.goal_id,
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
            logger.info(
                f"Contribution created: id={contribution.id}, user={user.id}, amount={amount}"
            )

            # Web2 settlement: funds are already locked from a real wallet
            # balance above, so finalizing here is the actual money movement
            # (into the group's contribution pool) — no on-chain step involved.
            await ContributionService.mark_contribution_success(
                db=db,
                contribution_id=contribution.id,
                action_type=ContributionActionType.MANUAL_SUBMIT,
            )
            logger.info(f"Contribution completed: id={contribution.id}")

            # Reload to get updated status
            await db.refresh(contribution)
            return contribution

        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(
                f"Unexpected error in process_manual_contribution: {e}", exc_info=True
            )
            # Give the locked funds back, then ALWAYS fail the request: the
            # old code only raised when this cleanup itself failed, so a
            # successful cleanup fell off the end and the API reported
            # "processed successfully" with no contribution.
            try:
                await WalletService.release_locked_funds(
                    user_id=user.id, amount=stable_amount, db=db
                )
            except Exception:
                logger.error(f"Failed to cleanup locked funds for user {user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while processing your contribution.",
            )

    @staticmethod
    async def initiate_paystack_contribution(
        contribution_data: ContributionCreate,
        user: AuthenticatedUser,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        Start a contribution paid directly through Paystack (no wallet funds).

        Creates a `pending` Contribution whose `tx_id` is the Paystack
        reference, then initializes the Paystack transaction. The contribution
        is completed later by the webhook / callback via
        `settle_paystack_contribution`.
        """
        from src.domains.payments.schemas import PaystackPayload
        from src.domains.payments.service import PaymentService

        amount = await ContributionService._validate_contribution_request(
            contribution_data, user, db
        )
        currency = contribution_data.currency or "NGN"
        reference = f"CW-CONTRIB-{uuid4().hex}"

        contribution = Contribution(
            group_id=contribution_data.group_id,
            goal_id=contribution_data.goal_id,
            user_id=user.id,
            amount=amount,
            currency=currency,
            due_date=contribution_data.due_date,
            note=f"Paystack contribution - {contribution_data.note or ''}",
            status=ContributionStatus.pending,
            tx_id=reference,
        )
        db.add(contribution)
        await db.commit()
        await db.refresh(contribution)

        payload = PaystackPayload(
            amount=int(amount * 100),  # Paystack expects the minor unit (kobo)
            email=user.email,
            currency=currency,
            tx_ref=reference,
            meta={"note": "Contribution on Coopwise"},
        )
        try:
            response = await PaymentService.init_pay_with_paystack(
                payload,
                channels=None,
                extra_metadata={
                    "contribution_id": str(contribution.id),
                    "group_id": str(contribution.group_id),
                },
            )
            if not response or not response.get("status"):
                raise ValueError((response or {}).get("message", "Paystack rejected"))
        except Exception as e:
            logger.error(
                f"Paystack init failed for contribution {contribution.id}: {e}"
            )
            await ContributionService.mark_contribution_failed(
                db, contribution.id, f"Paystack initialization failed: {e}"
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not start the payment. Please try again.",
            )

        return {
            "contribution": contribution,
            "reference": reference,
            "authorization_url": response["data"]["authorization_url"],
        }

    @staticmethod
    async def get_contribution_by_reference(
        db: AsyncSession, reference: str
    ) -> Optional[Contribution]:
        result = await db.execute(
            select(Contribution).where(Contribution.tx_id == reference)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def settle_paystack_contribution(
        db: AsyncSession, contribution: Contribution, paid_amount_minor: int
    ) -> bool:
        """
        Complete a Paystack-paid contribution. Idempotent (webhook + callback
        can both fire). `paid_amount_minor` is the amount Paystack reports as
        actually paid; an underpayment is failed rather than credited.

        Returns True if this call completed the contribution.
        """
        if contribution.status == ContributionStatus.completed:
            return False

        expected_minor = int(Decimal(str(contribution.amount)) * 100)
        if paid_amount_minor < expected_minor:
            await ContributionService.mark_contribution_failed(
                db,
                contribution.id,
                f"Underpaid: expected {expected_minor}, got {paid_amount_minor}",
            )
            return False

        await ContributionService.mark_contribution_success(
            db=db,
            contribution_id=contribution.id,
            tx_hash=contribution.tx_id,
            action_type=ContributionActionType.MANUAL_SUBMIT,
            debit_wallet=False,
        )
        return True

    @staticmethod
    async def process_auto_contribution(
        group_id: UUID, user: AuthenticatedUser, db: AsyncSession
    ) -> Optional[ContributionDetail]:
        """
        Process an automated contribution based on group policy.

        Called by scheduled worker (e.g., Celery) for recurring contributions.
        This is the primary time-based contribution mechanism.

        Web2 flow (no blockchain — see process_manual_contribution):
        1. Validate user is active member
        2. Check if contribution is due (based on frequency)
        3. Verify wallet has sufficient balance
        4. Lock funds
        5. Finalize the wallet debit
        6. Record in database

        Returns None if contribution is not yet due or fails gracefully.
        """
        try:
            # Validate membership
            membership = (
                await CooperativeMembershipService.get_membership_by_user_and_group(
                    user_id=user.id, group_id=group_id, db=db
                )
            )
            if not membership or not membership.is_active:
                logger.warning(
                    f"Auto-contribution skipped: inactive member user={user.id}, group={group_id}"
                )
                return None

            # Get group details
            from src.domains.cooperatives.services.cooperative_service import (
                CooperativeService,
            )

            group = await CooperativeService.get_coop_group_by_id(db, group_id)
            if not group or group.status != "active":
                logger.warning(
                    f"Auto-contribution skipped: group not active group={group_id}"
                )
                return None

            # Financial rule holds contribution_amount/frequency — these
            # aren't flat fields on CoopCooperative itself.
            try:
                financial_rule = await FinancialRuleService(UnitOfWork(db)).get_active(
                    group_id
                )
            except RuleNotFoundError:
                logger.warning(
                    f"Auto-contribution skipped: no financial rule configured for group={group_id}"
                )
                return None

            # Check if contribution is due based on frequency
            if not await ContributionService._is_contribution_due(
                db, group_id, user.id
            ):
                logger.debug(
                    f"Contribution not yet due: user={user.id}, group={group_id}"
                )
                return None

            # wallet.stable_coin_balance is stable-coin-denominated — convert
            # the (local-currency) rule amount before comparing/locking, same
            # as process_manual_contribution.
            stable_amount = (
                financial_rule.contribution_amount * MOCK_LOCAL_TO_STABLE_RATE
            )

            # Check wallet balance
            wallet_balance = await WalletService.get_effective_balance(user.id, db)
            if wallet_balance < stable_amount:
                logger.warning(
                    f"Insufficient balance for auto-contribution: user={user.id}, "
                    f"required={stable_amount}, available={wallet_balance}"
                )
                # Don't raise - just skip this user
                return None

            # Lock funds
            lock_result = await WalletService.lock_for_contribution(
                user_id=user.id, amount=stable_amount, db=db
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
                amount=financial_rule.contribution_amount,
                currency=financial_rule.currency,
                status=ContributionStatus.initiated,
                note=(
                    "Automatic "
                    f"{getattr(financial_rule.contribution_frequency, 'value', financial_rule.contribution_frequency)}"
                    " contribution"
                ),
            )

            db.add(contribution)
            await db.commit()
            await db.refresh(contribution)

            # Web2 settlement (see process_manual_contribution)
            await ContributionService.mark_contribution_success(
                db=db,
                contribution_id=contribution.id,
                action_type=ContributionActionType.AUTO_DEBIT,
            )
            logger.info(
                f"Auto-contribution processed: user={user.id}, group={group_id}, "
                f"amount={financial_rule.contribution_amount}"
            )
            await db.refresh(contribution)
            return contribution

        except Exception as e:
            logger.error(f"Error in process_auto_contribution: {e}", exc_info=True)
            return None

    @staticmethod
    async def _is_contribution_due(
        db: AsyncSession, group_id: UUID, user_id: UUID
    ) -> bool:
        """
        Check if a users's contribution is due based on frequency and last contribution.
        """
        # Get group
        from src.domains.cooperatives.services.cooperative_service import (
            CooperativeService,
        )

        group = await CooperativeService.get_coop_group_by_id(db, group_id)
        if not group:
            return False

        try:
            financial_rule = await FinancialRuleService(UnitOfWork(db)).get_active(
                group_id
            )
        except RuleNotFoundError:
            return False

        # Get last contribution
        last_contribution = await db.execute(
            select(Contribution)
            .where(
                and_(
                    Contribution.user_id == user_id,
                    Contribution.group_id == group_id,
                    Contribution.status == ContributionStatus.completed,
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
        frequency = financial_rule.contribution_frequency

        if frequency == ContributionFrequency.DAILY:
            due_date = last.created_at + timedelta(days=1)
        elif frequency == ContributionFrequency.WEEKLY:
            due_date = last.created_at + timedelta(weeks=1)
        elif frequency == ContributionFrequency.BIWEEKLY:
            due_date = last.created_at + timedelta(weeks=2)
        elif frequency == ContributionFrequency.MONTHLY:
            due_date = last.created_at + timedelta(days=30)
        else:
            return False

        return now >= due_date

    @staticmethod
    async def mark_contribution_success(
        db: AsyncSession,
        contribution_id: UUID,
        tx_hash: str = None,
        action_type: ContributionActionType = ContributionActionType.MANUAL_SUBMIT,
        debit_wallet: bool = True,
    ) -> Dict[str, Any]:
        """
        Mark a contribution as successfully completed.

        `debit_wallet=False` is for contributions paid directly through a
        gateway (Paystack): no wallet funds were locked, so none are finalized.
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

            # Finalize wallet debit — contribution.amount is local-currency;
            # what's actually locked/held is stable-coin-denominated (see
            # process_manual_contribution / process_auto_contribution).
            if debit_wallet:
                await WalletService.finalize_contribution_debit(
                    user_id=contribution.user_id,
                    amount=Decimal(str(contribution.amount))
                    * MOCK_LOCAL_TO_STABLE_RATE,
                    db=db,
                )

            await ActivityService.log(
                db,
                ActivityCreate(
                    user_id=contribution.user_id,
                    group_id=contribution.group_id,
                    type=ActivityType.made_contribution,
                    description=f"Contributed {contribution.currency} {contribution.amount} to the group",
                    entity_id=str(contribution.id),
                    amount=float(contribution.amount),
                ),
            )

            logger.info(
                f"Contribution marked successful: id={contribution_id}, "
                f"action={action_type.value}, tx={tx_hash}"
            )

            return {
                "message": "Contribution marked as completed successfully.",
                "contribution_id": str(contribution_id),
                "status": "completed",
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
        action_type: ContributionActionType = ContributionActionType.MANUAL_SUBMIT,
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
                "reason": reason,
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
                    detail=f"Invalid status: {contribution_status}",
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
                "status": new_status.value,
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
        limit: int = 10,
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

            query = (
                query.offset(skip).limit(limit).order_by(Contribution.created_at.desc())
            )

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
        db: AsyncSession, user_id: UUID, group_id: UUID
    ) -> Dict[str, Any]:
        """
        Get comprehensive contribution summary for a user in a specific group.
        """
        try:
            contributions = await ContributionService.get_contributions(
                db, group_id=group_id, user_id=user_id, limit=1000
            )

            completed = [
                c for c in contributions if c.status == ContributionStatus.completed
            ]
            pending = [
                c
                for c in contributions
                if c.status
                in (ContributionStatus.initiated, ContributionStatus.pending)
            ]
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
                        "fulfilled_at": (
                            c.fulfilled_at.isoformat() if c.fulfilled_at else None
                        ),
                    }
                    for c in contributions[:20]  # Return last 20
                ],
            }
        except Exception as e:
            logger.error(f"Failed to get user group contributions: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch contribution summary",
            )

    @staticmethod
    async def get_goal_progress(db: AsyncSession, goal_id: UUID) -> Dict[str, Any]:
        """
        Compute a goal's funding progress from its completed contributions.
        """
        goal = await db.get(CoopGoal, goal_id)
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        stmt = select(
            func.coalesce(func.sum(Contribution.amount), 0),
            func.count(func.distinct(Contribution.user_id)),
        ).where(
            Contribution.goal_id == goal_id,
            Contribution.status == ContributionStatus.completed,
        )
        result = await db.execute(stmt)
        contributed_amount, contributor_count = result.one()
        contributed_amount = float(contributed_amount)

        target_amount = float(goal.target_amount) if goal.target_amount else None
        percent_complete = (
            round(min(contributed_amount / target_amount, 1.0) * 100, 1)
            if target_amount
            else None
        )

        return {
            "goal_id": goal_id,
            "target_amount": target_amount,
            "currency": goal.currency,
            "contributed_amount": contributed_amount,
            "percent_complete": percent_complete,
            "contributor_count": contributor_count,
        }
