from datetime import datetime
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession


from src.domains.contributions.schemas import (
    ContributionCreate,
    ContributionDetail,
    GoalProgress,
    GroupContributionSummary,
    LeaderboardResponse,
)
from src.api.middlewares.dependencies import get_current_user, get_current_admin_user
from src.domains.contributions.service import ContributionService
from src.domains.auth.schemas import AuthenticatedUser
from src.infra.db.dependencies import get_async_db_session
from src.domains.memberships.service import CooperativeMembershipService


router = APIRouter(prefix="/api/v1/contributions", tags=["Contributions"])

CUTOFF_DATE = datetime.fromisoformat("2025-06-30T00:00:00")  # Mock payment cutoff date


@router.post("/contribute", summary="Makes a contribution to a group")
async def contribute(
    contribution_data: ContributionCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    mode: str = "manual",  # "manual" or "auto"
):
    """
    Makes a contribution of a specific amount to a cooperative group.
    Supports both manual and automated debit flows.
    """

    if mode == "manual":
        contribution = await ContributionService.process_manual_contribution(
            contribution_data, current_user, db
        )
    elif mode == "auto":
        contribution = await ContributionService.process_auto_contribution(
            contribution_data.group_id, current_user, db
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid contribution mode.")

    return {
        "message": "Contribution processed successfully",
        "contribution": contribution,
        "mode": mode,
    }


@router.post(
    "/paystack/initiate",
    summary="Start a contribution paid directly through Paystack",
)
async def initiate_paystack_contribution(
    contribution_data: ContributionCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Creates a pending contribution and returns a Paystack `authorization_url`
    to redirect the member to. The contribution completes once Paystack
    confirms payment (webhook / callback) — the wallet is not involved.
    """
    result = await ContributionService.initiate_paystack_contribution(
        contribution_data, current_user, db
    )
    return {
        "message": "Payment initialized",
        "contribution": ContributionDetail.model_validate(result["contribution"]),
        "reference": result["reference"],
        "authorization_url": result["authorization_url"],
    }


@router.post("/auto-debit", summary="Trigger automated debit for group contributions")
async def auto_debit(
    group_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Trigger an automated debit for the current user's contribution to a group.
    Used by group policies or scheduled tasks.
    """

    contribution = await ContributionService.process_auto_contribution(
        group_id, current_user, db
    )

    return {
        "message": "Automated contribution processed successfully",
        "contribution": contribution,
    }


@router.get("/goals/{goal_id}/progress", response_model=GoalProgress)
async def get_goal_progress(
    goal_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Fetch a goal's funding progress computed from its completed contributions.
    """
    return await ContributionService.get_goal_progress(db, goal_id)


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = 10,
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Public activity leaderboard. Cooperatives and members are ranked from
    activity, contributions, goals, join requests, and invites. Counts and
    names only — amounts stay off this endpoint.
    """
    return await ContributionService.get_platform_leaderboard(
        db, limit=min(max(limit, 1), 50)
    )


@router.get("/group/{group_id}/summary", response_model=GroupContributionSummary)
async def get_group_contribution_summary(
    group_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Group-wide total of completed contributions (goal-specific and general).
    Visible to any active member of the cooperative.
    """
    membership = await CooperativeMembershipService.get_membership_by_user_and_group(
        user_id=current_user.id, group_id=group_id, db=db
    )
    if not membership or not membership.is_active:
        raise HTTPException(
            status_code=403, detail="You are not an active member of this cooperative."
        )
    return await ContributionService.get_group_contribution_summary(db, group_id)


@router.get("/group/{group_id}", response_model=List[ContributionDetail])
async def list_group_contributions(
    group_id: UUID,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Fetch contributions for a cooperative group. Any active member of the
    group can view its contribution history.
    """
    membership = await CooperativeMembershipService.get_membership_by_user_and_group(
        user_id=current_user.id, group_id=group_id, db=db
    )
    if not membership or not membership.is_active:
        raise HTTPException(
            status_code=403, detail="You are not an active member of this cooperative."
        )
    return await ContributionService.get_contributions(
        db, group_id=group_id, skip=skip, limit=limit
    )


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
async def get_contributions_by_admin(
    skip: int = 0,
    limit: int = 10,
    user: AuthenticatedUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db_session),
) -> List[ContributionDetail]:
    """
    Fetch a list of contribution with optional pagination.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    return await ContributionService.get_contributions(db, skip=skip, limit=limit)
