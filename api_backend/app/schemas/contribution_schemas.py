from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

from db.models.contribution_model import ContributionStatus




class ContributionCreate(BaseModel):
    user_id: UUID
    group_id: UUID
    amount: float
    currency: str = "NGN"
    due_date: datetime = None
    note: str = None
    status: ContributionStatus = ContributionStatus.PLEDGED



class ContributionDetail(BaseModel):
    id: UUID
    user_id: UUID
    group_id: UUID
    amount: float
    currency: str = "NGN"
    due_date: datetime = None
    fulfilled_at: datetime = None
    note: str = None
    status: ContributionStatus = ContributionStatus.PLEDGED
    created_at: datetime
    updated_at: datetime