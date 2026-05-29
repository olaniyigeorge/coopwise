from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession


from src.domains.contributions.models import ContributionStatus
from config import AppConfig as config;
from src.shared.utils.logger import logger
from src.domains.circles.service import CooperativeGroupService
from src.api.middlewares.dependencies import get_redis
from src.domains.wallets.schemas import WalletDeposit
from src.domains.wallets.service import WalletService
from src.domains.notifications.schemas import NotificationCreate
from src.domains.notifications.service import NotificationService
from src.domains.payments.service import PaymentService
from src.domains.users.service import UserService
from src.domains.contributions.schemas import ContributionCreate, ContributionDetail
from src.api.middlewares.dependencies import get_current_user, is_admin_permissions
from src.domains.contributions.service import ContributionService
from src.domains.auth.schemas import AuthenticatedUser
from src.infra.db.dependencies import get_async_db_session


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
















from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession


from src.domains.contributions.models import ContributionStatus
from config import AppConfig as config;
from src.shared.utils.logger import logger
from src.domains.circles.service import CooperativeGroupService
from src.api.middlewares.dependencies import get_redis
from src.domains.wallets.schemas import WalletDeposit
from src.domains.wallets.service import WalletService
from src.domains.notifications.schemas import NotificationCreate
from src.domains.notifications.service import NotificationService
from src.domains.payments.service import PaymentService
from src.domains.users.service import UserService
from src.domains.contributions.schemas import ContributionCreate, ContributionDetail
from src.api.middlewares.dependencies import get_current_user, is_admin_permissions
from src.domains.contributions.service import ContributionService
from src.domains.auth.schemas import AuthenticatedUser
from src.infra.db.dependencies import get_async_db_session


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
