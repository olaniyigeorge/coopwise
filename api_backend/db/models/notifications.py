
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
    GROUP = "group"
    TRANSACTION = "transaction"
    MEMBERSHIP = "membership"
    CONTRIBUTION = "contribution"
    # DEPOSIT = "deposit"
    PAYOUT = "payout"
    GENERAL_ALERT = "general_alert"
    SYSTEM = "system"
    AI_INSIGHT = "ai_insight"
    OTHER = "other"


class NotificationType(enum.Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    DANGER = "danger"


class NotificationStatus(enum.Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"
    DELETED = "deleted"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    type = Column(Enum(NotificationType), nullable=False, default=NotificationType.INFO)
    status = Column(Enum(NotificationStatus), nullable=False, default=NotificationStatus.UNREAD)
    event_type = Column(Enum(EventType), nullable=False)

    entity_url = Column(String(255), nullable=True)  # URL to the related entity (e.g., group, transaction)

    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Optional relationships
    user = relationship("User", back_populates="notifications", lazy="joined")

    def mark_as_read(self):
        self.is_read = True
        self.read_at = datetime.now()