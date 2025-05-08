from datetime import datetime
from decimal import Decimal
from uuid import UUID
from db.database import Base




class Contribution(Base):
    id: UUID
    group_id: UUID
    user_id: UUID
    amount: Decimal
    contribution_date: datetime
    method: str  # manual, auto
    status: str  # pending, completed, missed
