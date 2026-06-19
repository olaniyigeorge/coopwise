"""Notification domain models.

Tables:
    Notification                  — canonical notification record (idempotent, auditable)
    NotificationEvent             — append-only audit trail per lifecycle event
    UserNotificationPreferences   — per-user channel opt-in/out
"""
import enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey,
    Integer, String, Text, JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from src.infra.db.database import Base


# Enums 

class NotificationChannel(enum.Enum):
    push   = "push"
    sms    = "sms"
    email  = "email"
    in_app = "in_app"


class NotificationPriority(enum.Enum):
    critical  = "critical"    # financial alerts — never dropped
    normal    = "normal"      # transactional
    marketing = "marketing"   # bulk campaigns


class NotificationStatus(enum.Enum):
    # Delivery pipeline statuses
    pending       = "pending"
    queued        = "queued"
    delivered     = "delivered"
    failed        = "failed"
    suppressed    = "suppressed"     # user opted out
    manual_review = "manual_review"  # exhausted retries → ops queue
    # In-app read statuses (for frontend bell)
    unread   = "unread"
    read     = "read"
    archived = "archived"
    deleted  = "deleted"


class NotificationType(enum.Enum):
    info    = "info"
    success = "success"
    warning = "warning"
    error   = "error"
    ai      = "ai"
    alert   = "alert"
    system  = "system"
    danger  = "danger"


class EventType(enum.Enum):
    group         = "group"
    transaction   = "transaction"
    membership    = "membership"
    contribution  = "contribution"
    payout        = "payout"
    general_alert = "general_alert"
    system        = "system"
    ai_insight    = "ai_insight"
    other         = "other"


def _default_idempotency_key() -> str:
    """Auto-generate a namespaced idempotency key for in-app/system notifications."""
    return f"in_app:{uuid4()}"


# Models 

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Idempotency — caller supplies e.g. "contribution:txn_123:confirmed"
    # Falls back to "in_app:{uuid}" for internally-generated notifications
    idempotency_key = Column(
        String(255), unique=True, nullable=False,
        default=_default_idempotency_key, index=True
    )

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"),
        nullable=False, index=True
    )

    # Delivery
    channel  = Column(Enum(NotificationChannel), nullable=False, default=NotificationChannel.in_app)
    priority = Column(Enum(NotificationPriority), nullable=False, default=NotificationPriority.normal)
    status   = Column(Enum(NotificationStatus), nullable=False, default=NotificationStatus.unread)

    # Content
    title       = Column(String(255), nullable=False)
    message     = Column(Text, nullable=False)
    template_id = Column(String(100), nullable=True)
    payload     = Column(JSON, nullable=True)         # template variables / extra context
    entity_url  = Column(String(255), nullable=True)  # deep-link to related entity

    # Classification
    type       = Column(Enum(NotificationType), nullable=False, default=NotificationType.info)
    event_type = Column(Enum(EventType), nullable=False, default=EventType.general_alert)

    # Provider tracking (populated after delivery attempt)
    provider     = Column(String(100), nullable=True)  # e.g. "sendgrid", "termii", "fcm"
    provider_ref = Column(String(255), nullable=True)  # provider's own message ID

    # Retry / delivery tracking
    attempts          = Column(Integer, nullable=False, default=0)
    last_attempted_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at      = Column(DateTime(timezone=True), nullable=True)

    # Legacy in-app read state (kept for existing frontend)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user   = relationship("User", back_populates="notifications", lazy="joined")
    events = relationship(
        "NotificationEvent", back_populates="notification",
        lazy="dynamic", cascade="all, delete-orphan"
    )


class NotificationEvent(Base):
    """Append-only audit trail — one row per lifecycle event per notification."""
    __tablename__ = "notification_events"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    notification_id = Column(
        UUID(as_uuid=True), ForeignKey("notifications.id"),
        nullable=False, index=True
    )
    # queued | attempted | delivered | failed | retried | suppressed
    event    = Column(String(50), nullable=False)
    provider = Column(String(100), nullable=True)
    detail   = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    notification = relationship("Notification", back_populates="events")


class UserNotificationPreferences(Base):
    """Per-user channel opt-in/out. Upserted on first notification send if absent."""
    __tablename__ = "user_notification_preferences"

    user_id   = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    push      = Column(Boolean, nullable=False, default=True)
    sms       = Column(Boolean, nullable=False, default=True)
    email     = Column(Boolean, nullable=False, default=True)
    in_app    = Column(Boolean, nullable=False, default=True)
    marketing = Column(Boolean, nullable=False, default=True)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.now, onupdate=datetime.now
    )

    user = relationship("User", back_populates="notification_preferences")