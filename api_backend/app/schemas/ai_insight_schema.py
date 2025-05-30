



from datetime import datetime
import enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict



class InsightCategory(enum.Enum):
    CONTRIBUTION = "contribution"
    SAVINGS = "savings"
    BEHAVIOR = "behavior"
    GROUP = "group"
    MILESTONE = "milestone"
    OTHER = "other"


class InsightStatus(enum.Enum):
    ACTIVE = "active"
    READY = "ready"
    EXPIRED = "expired"


class AIInsightDetail(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    summary: str
    category: InsightCategory
    recommended_action: str
    impact_score: float
    potential_gain: float
    status: InsightStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
