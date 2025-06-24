from datetime import datetime
from uuid import uuid4, UUID
from sqlalchemy import JSON, Column, String, Text, Enum as SQLAlchemyEnum, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from db.database import Base
import enum

# ------------


class InsightCategory(enum.Enum):
    contribution = "contribution"
    savings = "savings"
    behavior = "behavior"
    group = "group"
    milestone = "milestone"
    energy_saving = "energy_saving"
    financial_optimization = "financial_optimization"
    contribution_strategy = "contribution_strategy"
    spending_analysis = "spending_analysis"
    investment_tips = "investment_tips"
    budgeting = "budgeting"
    goal_setting = "goal_setting"
    other = "other"


class InsightType(enum.Enum):
    personal = "personal"
    group_specific = "group_specific"
    general = "general"
    trending = "trending"

class DifficultyLevel(enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"

class ImplementationStatus(enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"
    dismissed = "dismissed"


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    summary = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=True)

    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    group_id = Column(PGUUID(as_uuid=True), ForeignKey("cooperative_groups.id"), nullable=True)

    category = Column(SQLAlchemyEnum(InsightCategory), default=InsightCategory.other, nullable=False)
    type = Column(SQLAlchemyEnum(InsightType), default=InsightType.general, nullable=False)
    difficulty = Column(SQLAlchemyEnum(DifficultyLevel), default=DifficultyLevel.medium, nullable=False)
    status = Column(SQLAlchemyEnum(ImplementationStatus), default=ImplementationStatus.not_started)

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


