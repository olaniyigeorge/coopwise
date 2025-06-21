from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from db.models.contribution_model import ContributionStatus




class ContributionCreate(BaseModel):
    user_id: UUID
    group_id: UUID
    amount: float
    currency: str = "NGN"
    due_date: datetime = None
    note: str = None
    status: ContributionStatus = ContributionStatus.PLEDGED

    model_config = ConfigDict(from_attributes=True)


class ContributionDetail(BaseModel):
    id: UUID
    user_id: UUID
    group_id: UUID
    amount: float
    currency: str = "NGN"
    due_date: Optional[datetime] = None
    fulfilled_at: Optional[datetime]  = None
    note: str = None
    status: ContributionStatus = ContributionStatus.PLEDGED
    created_at: datetime
    updated_at: datetime



    model_config = ConfigDict(from_attributes=True)