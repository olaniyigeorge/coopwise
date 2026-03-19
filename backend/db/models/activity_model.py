from sqlalchemy import Column, String, Enum, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from db.database import Base


class ActivityType(enum.Enum):
    joined_group = "joined_group"
    left_group = "left_group"
    made_contribution = "made_contribution"
    received_payout = "received_payout"
    declined_invite = "declined_invite"
    accepted_invite = "accepted_invite"
    created_group = "created_group"


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    group_id = Column(
        UUID(as_uuid=True), ForeignKey("cooperative_groups.id"), nullable=True
    )

    type = Column(Enum(ActivityType), nullable=False)
    entity_id = Column(
        String,
        nullable=True,
        doc="Primary key of the related entity (int or UUID), stored as text",
    )
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="activities")
    group = relationship("CooperativeGroup", back_populates="activities")
