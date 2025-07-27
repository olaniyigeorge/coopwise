from datetime import datetime
from uuid import UUID
from db.database import Base

from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4

import enum


class EventType(enum.Enum):
    group = "group"
    transaction = "transaction"
    membership = "membership"
    contribution = "contribution"
    payout = "payout"
    general_alert = "general_alert"
    system = "system"
    ai_insight = "ai_insight"
    other = "other"


class NotificationType(enum.Enum):
    info = "info"
    success = "success"
    warning = "warning"
    error = "error"
    ai = "ai"
    alert = "alert"
    system = "system"
    danger = "danger"


class NotificationStatus(enum.Enum):
    unread = "unread"
    read = "read"
    archived = "archived"
    deleted = "deleted"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    type = Column(Enum(NotificationType), nullable=False, default=NotificationType.info)
    status = Column(
        Enum(NotificationStatus), nullable=False, default=NotificationStatus.unread
    )
    event_type = Column(Enum(EventType), nullable=False)

    entity_url = Column(
        String(255), nullable=True
    )  # URL to the related entity (e.g., group, transaction)

    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Optional relationships
    user = relationship("User", back_populates="notifications", lazy="joined")

    def mark_as_read(self):
        self.is_read = True
        self.read_at = datetime.now()
