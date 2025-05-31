import enum
from uuid import UUID
from pydantic import BaseModel
from typing import List, Optional, Literal
from app.schemas.ai_insight_schema import AIInsightDetail
from app.schemas.cooperative_group import CoopGroupDetails, CoopGroupTargetSummary
from app.schemas.cooperative_membership import MembershipDetails
from app.schemas.notifications_schema import NotificationDetail
from app.schemas.user import UserDetail


class Summary(BaseModel):
    your_savings: float  # Sum of user's contribution amounts
    next_contribution: Optional[str]  # Next upcoming contribution date across all groups
    next_payout: Optional[str]  # Next payout date across all groups
    payout_number: Optional[int]  # User's next payout position across groups


class GroupGoal(BaseModel):
    group_id: str
    group_name: str
    goal_amount: float
    saved_so_far: float


class Targets(BaseModel):
    savings_target: float  # User's personal savings goal
    group_goals: List[CoopGroupTargetSummary]  # Goals for each group user is part of

class ActivityType(enum.Enum):
    CONTRIBUTION = "contribution"     
    PAYOUT = "payout"      
    JOINED_GROUP = "joined_group" 
    CREATED_GROUP = "created_group"       
 

class Activity(BaseModel):
    type: ActivityType
    user_id: UUID
    entity_id: UUID | int 
    created_at: str 
    description: str
    amount: Optional[float]


class ExploreGroups(BaseModel):
    user_groups: List[CoopGroupDetails]
    suggested_groups: List[CoopGroupDetails]




class DashboardData(BaseModel):
    user: UserDetail
    summary: Summary
    targets: Targets
    groups: ExploreGroups  # Includes all user's groups + first page of suggested groups
    activities: List[Activity]  # Events triggered by the user in recent history
    ai_insights: List[AIInsightDetail]  # Personalized AI insights based on usage patterns
    notifications: List[NotificationDetail]  # Wrapper/decorators around service events
    cooperative_members: List[MembershipDetails]  # Members in user's groups
