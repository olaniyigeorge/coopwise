from sqlalchemy import Column, String, Enum, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from db.database import Base

class ActivityType(enum.Enum):
    JOINED_GROUP = "joined_group"
    LEFT_GROUP = "left_group"
    MADE_CONTRIBUTION = "made_contribution"
    RECEIVED_PAYOUT = "received_payout"
    DECLINED_INVITE = "declined_invite"
    ACCEPTED_INVITE = "accepted_invite"
    CREATED_GROUP = "created_group"

 
class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    group_id = Column(UUID(as_uuid=True), ForeignKey("cooperative_groups.id"), nullable=True)

    type = Column(Enum(ActivityType), nullable=False)
    entity_id = Column(String, nullable=True, doc="Primary key of the related entity (int or UUID), stored as text")
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="activities")
    group = relationship("CooperativeGroup", back_populates="activities")