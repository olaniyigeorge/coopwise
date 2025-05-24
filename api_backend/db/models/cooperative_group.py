from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4
from db.models.membership import GroupMembership
from db.database import Base
from sqlalchemy import JSON, Column, String, Enum, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
import enum


# Enum for Contribution Frequency
class ContributionFrequency(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


# Enum for Payout Strategy
class PayoutStrategy(enum.Enum):
    ROTATING = "rotating"
    EQUAL = "equal"
    PRIORITY = "priority"

class CooperativeModel(enum.Enum):
    AJO = "ajo"
    COOP = "coop"



# Enum for Cooperative Status
class CooperativeStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    COMPLETED = "completed"


class CooperativeGroup(Base):
    __tablename__ = "cooperative_groups"
    id =  Column(PGUUID(as_uuid=True),  primary_key=True, default=lambda: str(uuid4()), index=True)
    name = Column(String, nullable=False)
    description = Column(String, default=None, nullable=True)
    image_url = Column(String, default=None, nullable=True)
    creator_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    max_members = Column(Numeric, default=12, nullable=False)
    contribution_amount = Column(Numeric, nullable=False)
    contribution_frequency = Column(Enum(ContributionFrequency), nullable=False)
    payout_strategy = Column(Enum(PayoutStrategy), nullable=False)
    coop_model = Column(Enum(CooperativeModel), default=CooperativeModel.AJO, nullable=False)
    target_amount = Column(Numeric, nullable=False)
    status = Column(Enum(CooperativeStatus), default=CooperativeStatus.ACTIVE, nullable=False)
    
    rules = Column(JSON, nullable=True) # Like metatdata that are used to define the rules of the cooperative
    
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    memberships = relationship(
        "GroupMembership",
        back_populates="group",
        foreign_keys=[GroupMembership.group_id]
    )
    users = relationship(
        "User",
        secondary="group_memberships",
        back_populates="cooperatives",
        primaryjoin="CooperativeGroup.id == GroupMembership.group_id",
        secondaryjoin="GroupMembership.user_id == User.id",
        foreign_keys=[GroupMembership.user_id, GroupMembership.group_id],
        overlaps="group,memberships,user"
    )