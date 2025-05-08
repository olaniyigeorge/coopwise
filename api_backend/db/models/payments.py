
from datetime import datetime
from uuid import UUID
from db.database import Base
from decimal import Decimal



class Payout(Base):
    id: UUID
    group_id: UUID
    user_id: UUID
    amount: Decimal
    payout_date: datetime
    status: str  # scheduled, paid
