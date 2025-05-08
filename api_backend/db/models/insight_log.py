
from datetime import datetime
from uuid import UUID
from db.database import Base



class InsightLog(Base):
    id: UUID
    user_id: UUID
    group_id: UUID
    insight_type: str  # e.g., missed_contributions
    message: str
    created_at: datetime
