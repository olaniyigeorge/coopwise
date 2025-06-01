from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from db.models.ai_insight import AIInsight, DifficultyLevel, ImplementationStatus, InsightCategory, InsightType


#  ------------- AI Insight Schemas -------------


class InsightMetadata(BaseModel):
    success_rate: Optional[int] = 0
    users_implemented: Optional[int] = 0
    average_time_to_complete: Optional[float] = 0  # in seconds
    prerequisites: Optional[List[str]] = []
    related_insights: Optional[List[str]] = []
    source: Optional[str] = ""




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
    implementation_time: Optional[timedelta] = None

    insight_metadata: Optional[InsightMetadata] = None

    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True,
        fields={"metadata": "insight_metadata"}
    )


class AIInsightCreate(AIInsightBase):
    user_id: Optional[UUID]
    group_id: Optional[UUID]


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
