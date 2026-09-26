from pydantic import BaseModel
from typing import List, Optional, Any
from src.domains.wallets.schemas import WalletDetail
from src.domains.analytics.schemas import ActivityDetail
from src.domains.insights.schemas import AIInsightDetail
from src.domains.memberships.schemas import MembershipDetails
from src.domains.notifications.schemas import NotificationDetail
from src.domains.users.schemas import UserDetail


class Summary(BaseModel):
    your_savings: float  # Sum of user's contribution amounts
    next_contribution: Optional[
        str
    ]  # Next upcoming contribution date across all groups
    next_payout: Optional[str]  # Next payout date across all groups
    wallet: Optional[WalletDetail]  # includes stable_coin_balance — the wallet balance


class GroupGoal(BaseModel):
    group_id: str
    group_name: str
    goal_amount: float
    saved_so_far: float


class Targets(BaseModel):
    savings_target: float  # User's personal savings goal
    group_goals: List[
        Any
    ]  # CoopGroupTargetSummary   Goals for each group user is part of


class ExploreGroups(BaseModel):
    user_groups: List[Any]
    suggested_groups: List[Any]  # CoopGroupTargetSummary


class DashboardData(BaseModel):
    user: Optional[UserDetail]
    summary: Optional[Summary]
    targets: Optional[Targets]
    groups: Optional[
        ExploreGroups
    ]  # Includes all user's groups + first page of suggested groups
    activities: List[ActivityDetail]  # Events triggered by the user in recent history
    ai_insights: List[
        AIInsightDetail
    ]  # Personalized AI insights based on usage patterns
    notifications: List[NotificationDetail]  # Wrapper/decorators around service events
    cooperative_members: List[MembershipDetails]  # Members in user's groups
