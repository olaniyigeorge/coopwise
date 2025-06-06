from datetime import datetime
from uuid import uuid4, UUID
from sqlalchemy import JSON, Column, String, Text, Enum as SQLAlchemyEnum, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from db.database import Base
import enum

# ------------


class InsightCategory(enum.Enum):
    CONTRIBUTION = "contribution"
    SAVINGS = "savings"
    BEHAVIOR = "behavior"
    GROUP = "group"
    MILESTONE = "milestone"
    ENERGY_SAVING = "energy_saving"
    FINANCIAL_OPTIMIZATION = "financial_optimization"
    CONTRIBUTION_STRATEGY = "contribution_strategy"
    SPENDING_ANALYSIS = "spending_analysis"
    INVESTMENT_TIPS = "investment_tips"
    BUDGETING = "budgeting"
    GOAL_SETTING = "goal_setting"
    OTHER = "other"

# class InsightStatus(enum.Enum):
#     ACTIVE = "active"
#     READY = "ready"
#     EXPIRED = "expired"

class InsightType(enum.Enum):
    PERSONAL = "personal"
    GROUP_SPECIFIC = "group_specific"
    GENERAL = "general"
    TRENDING = "trending"

class DifficultyLevel(enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class ImplementationStatus(enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DISMISSED = "dismissed"


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    summary = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=True)

    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    group_id = Column(PGUUID(as_uuid=True), ForeignKey("cooperative_groups.id"), nullable=True)

    category = Column(SQLAlchemyEnum(InsightCategory), default=InsightCategory.OTHER, nullable=False)
    type = Column(SQLAlchemyEnum(InsightType), default=InsightType.GENERAL, nullable=False)
    difficulty = Column(SQLAlchemyEnum(DifficultyLevel), default=DifficultyLevel.MEDIUM, nullable=False)
    status = Column(SQLAlchemyEnum(ImplementationStatus), default=ImplementationStatus.NOT_STARTED)

    estimated_savings = Column(Float, default=0.0)
    potential_gain = Column(Float, default=0.0)
    impact_score = Column(Float, default=0.0)

    tags = Column(JSON, default=list)
    timeframe = Column(String, nullable=True)
    implementation_time = Column(Float, default=0.0)  # In seconds

    insight_metadata = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    user = relationship("User", back_populates="ai_insights", lazy="joined")
    group = relationship("CooperativeGroup", back_populates="ai_insights", lazy="joined")


