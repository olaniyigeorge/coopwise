from datetime import datetime
import json
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from uuid import UUID
import enum

from db.models.cooperative_group import (
    ContributionFrequency,
    CooperativeModel,
    PayoutStrategy,
)


class CooperativeStatus(str, enum.Enum):
    pending = "pending"   
    active = "active"
    inactive = "inactive"
    completed = "completed"


class JoinPolicy(str, enum.Enum):
    open = "open"
    invite_only = "invite_only"


# class CoopGroupBase(BaseModel):
#     name: str




class CoopGroupCreate(BaseModel):
    name: str
    creator_id: Optional[UUID] = None
    chain_circle_id: Optional[int] = None
    weekly_amount_usdc: Optional[float] = None
    current_round: int = 0
    is_complete: bool = False
    description: Optional[str] = None
    image_url: Optional[str] = None
    member_phones: List[str] = Field(default_factory=list, description="List of invited phone numbers")
    contribution_amount: float = Field(..., description="Amount in local currency (e.g., NGN)")
    currency: str = Field(default="NGN")
    contribution_frequency: ContributionFrequency
    payout_strategy: PayoutStrategy  # : str = Field(default="rotating")
    coop_model: CooperativeModel   # : str = Field(default="rosca")
    max_members: int
    target_amount: float
    rotation_order: str = Field(default="sequential", description="sequential or random")
    status: CooperativeStatus
    rules: Optional[List[dict]]
    join_policy: JoinPolicy = Field(
        default=JoinPolicy.invite_only,
        description="open = browse & join; invite_only = code required",
    )

class CoopGroupDetails(BaseModel):
    id: UUID
    chain_circle_id: Optional[int] = None
    name: str
    creator_id: UUID
    description: Optional[str] = None
    image_url: str | None = None
    currency: Optional[str]
    contribution_amount: float
    contribution_frequency: ContributionFrequency
    payout_strategy: PayoutStrategy
    coop_model: CooperativeModel
    max_members: int
    target_amount: float
    status: CooperativeStatus
    join_policy: JoinPolicy = JoinPolicy.invite_only

    rotation_order: str
    current_round: int
    is_complete: bool
    member_count: int = 0

    your_position_in_queue: Optional[int] = 1
 
    rules: List[dict] | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



class JoinCircleResponse(BaseModel):
    tx_id: str
    status: str
    message: str


class CoopGroupTargetSummary(BaseModel):
    id: UUID
    name: str
    contribution_amount: int
    target_amount: int

    model_config = ConfigDict(from_attributes=True)


class CoopGroupUpdate(BaseModel):
    name: str
    contribution_amount: int
    description: str | None = None
    contribution_frequency: ContributionFrequency
    payout_strategy: PayoutStrategy
    coop_model: CooperativeModel
    max_members: int
    target_amount: int
    status: CooperativeStatus
