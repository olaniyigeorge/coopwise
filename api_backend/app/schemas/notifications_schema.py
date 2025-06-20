from datetime import datetime
from enum import Enum
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal

from app.schemas.user import UserDetail
from db.models.notifications import EventType, NotificationStatus, NotificationType


class NotificationDetail(BaseModel):
    id: UUID
    #user_id: UUID
    title: Optional[str]
    message: Optional[str]
    event_type: EventType
    type: NotificationType
    status: NotificationStatus
    is_read: bool
    read_at: Optional[datetime]
    user: UserDetail
    entity_url: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationCreate(BaseModel):
    user_id: UUID
    title: str
    message: str
    event_type: EventType
    type: NotificationType
    entity_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationUpdate(BaseModel):

    title: Optional[str] 
    message: Optional[str]
    event_type: Optional[EventType]
    type: Optional[NotificationType]
    entity_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)