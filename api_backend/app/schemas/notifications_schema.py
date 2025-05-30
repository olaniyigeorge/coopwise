from datetime import datetime
from enum import Enum
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal

from app.schemas.user import UserDetail
from db.models.notifications import EventType, NotificationStatus, NotificationType


class NotificationDetail(BaseModel):
    id: UUID
    title: Optional[str]
    message: Optional[str]
    event_type: EventType
    type: NotificationType
    status: NotificationStatus
    is_read: bool
    user: UserDetail
    entity_url: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
