from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from apps.backend.src.domains.analytics.models import ActivityType


class ActivityCreate(BaseModel):
    user_id: UUID
    type: ActivityType
    description: str
    group_id: Optional[UUID] = None
    entity_id: Optional[str] = None
    amount: Optional[float] = None
    created_at: Optional[datetime] = None


class ActivityDetail(BaseModel):
    id: UUID
    user_id: UUID
    group_id: Optional[UUID]
    type: ActivityType
    description: str
    entity_id: Optional[str]
    amount: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}
