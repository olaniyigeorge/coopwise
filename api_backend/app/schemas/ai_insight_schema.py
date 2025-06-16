from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from db.models.ai_insight import AIInsight, DifficultyLevel, ImplementationStatus, InsightCategory, InsightType


#  ------------- AI Insight Schemas -------------


class InsightMetadata(BaseModel):
    success_rate: Optional[float] = 0
    users_implemented: Optional[int] = 0
    average_time_to_complete: Optional[float] = 0  # in seconds
    prerequisites: Optional[List[str]] = []
    related_insights: Optional[List[str]] = []
    source: Optional[str] = ""
    confidence_score: Optional[float] = None


class AIInsightBase(BaseModel):
    title: str
    description: Optional[str] = None
    summary: str
    recommended_action: Optional[str] = None

    category: InsightCategory
    type: InsightType
    difficulty: DifficultyLevel
    status: ImplementationStatus

    estimated_savings: float = 0.0
    potential_gain: float = 0.0
    impact_score: float = 0.0

    tags: List[str] = []
    timeframe: Optional[str] = None
    implementation_time: float = 0

    insight_metadata: Optional[InsightMetadata] = None

    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True,
        fields={"metadata": "insight_metadata"}
    )


class AIInsightCreate(AIInsightBase):
    user_id: Optional[UUID] = None
    group_id: Optional[UUID] =  None


class AIInsightDetail(AIInsightBase):
    id: UUID
    user_id: Optional[UUID]
    group_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True,
        fields={"metadata": "insight_metadata"}
    )





async def to_pydantic(insight: AIInsight) -> AIInsightDetail:
    return AIInsightDetail(
        **insight.__dict__,
        insight_metadata=InsightMetadata(**insight.insight_metadata) if insight.insight_metadata else None
    )









from datetime import timedelta

AI_INSIGHT_TEMPLATES = [
    # Engagement / Participation
    {
        "title": "Inactivity Detected",
        "summary": "Some members haven't participated in recent group activities.",
        "recommended_action": "Reach out to inactive members.",
        "category": InsightCategory.BEHAVIOR.value,
        "type": InsightType.GROUP_SPECIFIC.value,
        "difficulty": DifficultyLevel.EASY.value,
        "status": ImplementationStatus.IN_PROGRESS.value,
        "estimated_savings": 500.0,
        "potential_gain": 1000.0,
        "impact_score": 4.0,
        "tags": ["member", "engagement"],
        "timeframe": "Last 14 days",
        "implementation_time": 3600,
    },

    # New user onboarding insights
    {
        "title": "Welcome to CoopWise!",
        "summary": "Start by creating your first savings group.",
        "recommended_action": "Click 'Create Group' to begin saving with others.",
        "category": InsightCategory.GOAL_SETTING.value,
        "type": InsightType.PERSONAL.value,
        "difficulty": DifficultyLevel.EASY.value,
        "status": ImplementationStatus.COMPLETED.value,
        "estimated_savings": 0.0,
        "potential_gain": 0.0,
        "impact_score": 2.0,
        "tags": ["onboarding", "new-user"],
        "timeframe": "First 24 hours",
        "implementation_time": 600,
    },
    {
        "title": "No Activity Yet",
        "summary": "We noticed you haven't joined or created a group.",
        "recommended_action": "Explore existing groups or create a new one to get started.",
        "category": InsightCategory.BEHAVIOR.value,
        "type": InsightType.PERSONAL.value,
        "difficulty": DifficultyLevel.EASY.value,
        "status": ImplementationStatus.NOT_STARTED.value,
        "estimated_savings": 0.0,
        "potential_gain": 100.0,
        "impact_score": 1.0,
        "tags": ["new-user", "engagement"],
        "timeframe": "First 3 days",
        "implementation_time": 300,
    },
    {
        "title": "Set a Financial Goal",
        "summary": "Users with savings goals are more likely to reach them.",
        "recommended_action": "Set a savings goal to help track your progress.",
        "category": InsightCategory.GOAL_SETTING.value,
        "type": InsightType.PERSONAL.value,
        "difficulty": DifficultyLevel.EASY.value,
        "status": ImplementationStatus.NOT_STARTED.value,
        "estimated_savings": 0.0,
        "potential_gain": 500.0,
        "impact_score": 3.5,
        "tags": ["goal", "planning"],
        "timeframe": "First 7 days",
        "implementation_time": 3600,
    },

    # Financial optimization
    {
        "title": "Low Contribution Alert",
        "summary": "Your group's contributions have dropped recently.",
        "recommended_action": "Remind members to contribute on time.",
        "category": InsightCategory.CONTRIBUTION.value,
        "type": InsightType.GROUP_SPECIFIC.value,
        "difficulty": DifficultyLevel.EASY.value,
        "status": ImplementationStatus.NOT_STARTED.value,
        "estimated_savings": 1500.0,
        "potential_gain": 3000.0,
        "impact_score": 7.0,
        "tags": ["contributions", "reminders"],
        "timeframe": "Last 7 days",
        "implementation_time": 7200,
    },
    {
        "title": "Frequent Withdrawals Detected",
        "summary": "Too many withdrawals can hurt your group's growth.",
        "recommended_action": "Review withdrawal policy or encourage longer saving periods.",
        "category": InsightCategory.FINANCIAL_OPTIMIZATION.value,
        "type": InsightType.GROUP_SPECIFIC.value,
        "difficulty": DifficultyLevel.MEDIUM.value,
        "status": ImplementationStatus.IN_PROGRESS.value,
        "estimated_savings": 1000.0,
        "potential_gain": 5000.0,
        "impact_score": 6.0,
        "tags": ["withdrawals", "cashflow"],
        "timeframe": "This month",
        "implementation_time": 9200,
    },
]
