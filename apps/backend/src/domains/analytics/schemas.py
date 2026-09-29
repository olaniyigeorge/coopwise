from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from src.domains.analytics.models import ActivityType


class ActivityCreate(BaseModel):
    user_id: UUID
    type: ActivityType
    description: str
    group_id: Optional[UUID] = None
    entity_id: Optional[str] = None
    amount: Optional[float] = None
    created_at: Optional[datetime] = None


class ActivityActor(BaseModel):
    """Who performed an activity — just enough to render a name/avatar/link."""

    id: UUID
    username: str
    full_name: str
    profile_picture_url: Optional[str] = None

    model_config = {"from_attributes": True}


class ActivityDetail(BaseModel):
    id: UUID
    user_id: UUID
    group_id: Optional[UUID]
    type: ActivityType
    description: str
    entity_id: Optional[str]
    amount: Optional[float]
    created_at: datetime
    actor: Optional[ActivityActor] = None

    model_config = {"from_attributes": True}
