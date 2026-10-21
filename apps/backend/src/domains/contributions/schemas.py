from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from src.domains.contributions.models import ContributionStatus


class ContributionCreate(BaseModel):
    # Not used for authorization — the authenticated user (from the session)
    # is always who the contribution is recorded against.
    user_id: Optional[UUID] = None
    group_id: UUID
    amount: float
    goal_id: Optional[UUID] = None
    currency: str = "NGN"
    due_date: datetime = None
    note: str = None
    status: ContributionStatus = ContributionStatus.pledged

    model_config = ConfigDict(from_attributes=True)


class ContributionDetail(BaseModel):
    id: UUID
    user_id: UUID
    group_id: UUID
    amount: float
    goal_id: Optional[UUID] = None
    currency: str = "NGN"
    due_date: Optional[datetime] = None
    fulfilled_at: Optional[datetime] = None
    note: str = None
    status: ContributionStatus = ContributionStatus.pledged
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoalProgress(BaseModel):
    goal_id: UUID
    target_amount: Optional[float] = None
    currency: str = "NGN"
    contributed_amount: float
    percent_complete: Optional[float] = None
    contributor_count: int

    model_config = ConfigDict(from_attributes=True)


class GroupContributionSummary(BaseModel):
    group_id: UUID
    total_contributed: float
    contribution_count: int
    contributor_count: int
    currency: str = "NGN"

    model_config = ConfigDict(from_attributes=True)


class LeaderboardCircle(BaseModel):
    group_id: UUID
    name: str
    status: str
    member_count: int
    contribution_count: int
    contributor_count: int
    score: int = 0
    activity_count: int = 0
    goal_count: int = 0
    goals_completed: int = 0
    join_requests: int = 0
    invite_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class LeaderboardMember(BaseModel):
    user_id: UUID
    name: str
    score: int
    activity_count: int
    contribution_count: int
    goals_created: int
    goals_completed: int
    join_requests: int
    invite_count: int

    model_config = ConfigDict(from_attributes=True)


class LeaderboardPlatformStats(BaseModel):
    total_circles: int
    active_circles: int
    total_members: int
    total_contributions: int


class LeaderboardResponse(BaseModel):
    platform_stats: LeaderboardPlatformStats
    top_circles: list[LeaderboardCircle]
    top_members: list[LeaderboardMember] = []


class CircleHistoryEntry(BaseModel):
    # From Contribution
    contribution_id: UUID
    amount: float
    currency: str
    status: str  # ContributionStatus enum value
    note: Optional[str] = None
    due_date: Optional[datetime] = None
    fulfilled_at: Optional[datetime] = None
    created_at: datetime

    # From User (joined)
    member_name: str  # full_name or username fallback
    member_address: Optional[str] = None  # flow_address

    # Computed
    explorer_url: Optional[str] = None  # only populated once tx_id column exists

    model_config = ConfigDict(from_attributes=True)
