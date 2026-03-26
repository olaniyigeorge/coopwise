from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession


from db.models.contribution_model import ContributionStatus
from config import AppConfig as config;
from app.utils.logger import logger
from app.services.cooperative_group_service import CooperativeGroupService
from app.core.dependencies import get_redis
from app.schemas.wallet_schemas import WalletDeposit
from app.services.wallet_service import WalletService
from app.schemas.notifications_schema import NotificationCreate
from app.services.notification_service import NotificationService
from app.services.payment_service import PaymentService
from app.services.user_service import UserService
from app.schemas.contribution_schemas import ContributionCreate, ContributionDetail
from app.routers.v1.auth import get_current_user, is_admin_permissions
from app.services.contribution_service import ContributionService
from app.schemas.auth import AuthenticatedUser
from db.dependencies import get_async_db_session


router = APIRouter(prefix="/api/v1/contributions", tags=["Contributions"])

CUTOFF_DATE = datetime.fromisoformat("2025-06-30T00:00:00")  # Mock payment cutoff date


@router.post("/contribute", summary="Makes a contribution to a group")
async def contribute(
    contribution_data: ContributionCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    mode: str = "manual",  # "manual" or "auto"
    network: str = "flow",  # "flow" or "zama"
):
    """
    Makes a contribution of a specific amount to a cooperative group.
    Supports both manual and automated debit flows.
    """

    if mode == "manual":
        contribution = await ContributionService.process_manual_contribution(
            contribution_data, current_user, db, network
        )
    elif mode == "auto":
        contribution = await ContributionService.process_auto_debit(
            contribution_data.group_id, current_user, db, network
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid contribution mode.")

    return {
        "message": "Contribution processed successfully",
        "contribution": contribution,
        "mode": mode,
        "network": network
    }


@router.post("/auto-debit", summary="Trigger automated debit for group contributions")
async def auto_debit(
    group_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    network: str = "flow",
):
    """
    Trigger an automated debit for the current user's contribution to a group.
    Used by group policies or scheduled tasks.
    """

    contribution = await ContributionService.process_auto_debit(
        group_id, current_user, db, network
    )

    return {
        "message": "Automated contribution processed successfully",
        "contribution": contribution,
        "network": network
    }

    noti_data = NotificationCreate(
        user_id=contribution.user_id,
        title="Payment Successful",
        message=f"We settled your payment into {contribution_payment['data']['amount']} for your contribution {contribution.id}",
        event_type="transaction",
        type="success",
        entity_url=f"payment-{contribution.user_id}:{contribution.amount}",
    )
    await NotificationService.create_and_push_notification_to_user(noti_data, db)

    deposit_data = WalletDeposit(
        local_amount=Decimal(contribution.amount), currency="NGN"
    )

    wallet = await WalletService.deposit(
        deposit_data, db, user, redis=Depends(get_redis)
    )

    return {
        "message": "Contribution made successfully.",
        "contribution": contribution,
        "charge_response": contribution_payment,
        "wallet": wallet,
    }


@router.get("/{contribution_id}")
async def get_contribution(
    contribution_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Fetch a contribtion by ID.
    """
    contribution = await ContributionService.get_contribution_by_id(db, contribution_id)
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")
    return contribution


@router.get("/")
async def get_contributions(
    skip: int = 0,
    limit: int = 10,
    user: AuthenticatedUser = Depends(is_admin_permissions),
    db: AsyncSession = Depends(get_async_db_session),
) -> List[ContributionDetail]:
    """
    Fetch a list of contribution with optional pagination.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    return await ContributionService.get_contributions(db, skip=skip, limit=limit)
