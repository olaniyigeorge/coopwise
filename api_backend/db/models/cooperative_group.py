from datetime import datetime
from decimal import Decimal
from uuid import UUID
from db.database import Base
from sqlalchemy import Column, String, Enum, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
import enum


# Enum for Contribution Frequency
class ContributionFrequency(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"


# Enum for Payout Strategy
class PayoutStrategy(enum.Enum):
    ROTATING = "rotating"
    EQUAL = "equal"
    PRIORITY = "priority"


# Enum for Cooperative Status
class CooperativeStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    COMPLETED = "completed"


class CooperativeGroup(Base):
    __tablename__ = "cooperative_groups"
    id = Column(PGUUID(as_uuid=True), primary_key=True, index=True)
    name = Column(String, nullable=False)
    creator_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    contribution_amount = Column(Numeric, nullable=False)
    contribution_frequency = Column(Enum(ContributionFrequency), nullable=False)
    payout_strategy = Column(Enum(PayoutStrategy), nullable=False)
    target_amount = Column(Numeric, nullable=False)
    status = Column(Enum(CooperativeStatus), default=CooperativeStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    users = relationship("User", back_populates="cooperatives")
