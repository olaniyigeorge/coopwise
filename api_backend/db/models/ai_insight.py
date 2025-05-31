from datetime import datetime
from uuid import uuid4, UUID
from sqlalchemy import Column, String, Text, Enum, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from db.database import Base
import enum


class InsightCategory(str, enum.Enum):
    CONTRIBUTION = "contribution"
    SAVINGS = "savings"
    BEHAVIOR = "behavior"
    GROUP = "group"
    MILESTONE = "milestone"
    OTHER = "other"


class InsightStatus(str, enum.Enum):
    ACTIVE = "active"
    READY = "ready"
    EXPIRED = "expired"


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    category = Column(Enum(InsightCategory), nullable=False, default=InsightCategory.OTHER)
    recommended_action = Column(Text, nullable=True)

    impact_score = Column(Float, default=0.0)  # Scale 0.0 to 1.0
    potential_gain = Column(Float, default=0.0)  # Optional: ₦, % or unit-less

    status = Column(Enum(InsightStatus), default=InsightStatus.READY, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="ai_insights", lazy="joined")
