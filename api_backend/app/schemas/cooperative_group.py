from datetime import datetime
import json
from typing import List
from pydantic import BaseModel, ConfigDict, EmailStr
from uuid import UUID
import enum

from db.models.cooperative_group import ContributionFrequency, CooperativeModel, CooperativeStatus, PayoutStrategy


# class CoopGroupBase(BaseModel):
#     name: str

class CoopGroupCreate(BaseModel):
    name: str
    creator_id: UUID
    description: str | None = None
    contribution_amount: int = 15000
    image_url: str | None = None
    max_members: int = 12
    contribution_frequency: ContributionFrequency
    payout_strategy: PayoutStrategy
    coop_model: CooperativeModel
    target_amount: int = 180000
    status: CooperativeStatus
    rules: List[dict] | None

class CoopGroupDetails(BaseModel):
    id: UUID
    name: str
    creator_id: UUID
    description: str | None = None
    image_url: str | None = None
    contribution_amount: int
    contribution_frequency: ContributionFrequency
    payout_strategy: PayoutStrategy
    coop_model: CooperativeModel
    max_members: int 
    target_amount: int
    status: CooperativeStatus

    rules: List[dict] | None 
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


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