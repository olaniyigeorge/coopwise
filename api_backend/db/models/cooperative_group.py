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
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


# Enum for Payout Strategy
class PayoutStrategy(enum.Enum):
    rotating = "rotating"
    equal = "equal"
    priority = "priority"


class CooperativeModel(enum.Enum):
    ajo = "ajo"
    coop = "coop"


# Enum for Cooperative Status
class CooperativeStatus(enum.Enum):
    active = "active"
    inactive = "inactive"
    completed = "completed"


class CooperativeGroup(Base):
    __tablename__ = "cooperative_groups"
    id = Column(
        PGUUID(as_uuid=True), primary_key=True, default=lambda: str(uuid4()), index=True
    )
    name = Column(String, nullable=False)
    description = Column(String, default=None, nullable=True)
    image_url = Column(String, default=None, nullable=True)
    creator_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    max_members = Column(Numeric, default=12, nullable=False)
    contribution_amount = Column(Numeric, nullable=False)
    contribution_frequency = Column(Enum(ContributionFrequency), nullable=False)
    payout_strategy = Column(Enum(PayoutStrategy), nullable=False)
    coop_model = Column(
        Enum(CooperativeModel), default=CooperativeModel.ajo, nullable=False
    )
    target_amount = Column(Numeric, nullable=False)
    status = Column(
        Enum(CooperativeStatus), default=CooperativeStatus.inactive, nullable=False
    )
    next_payout_date = Column(DateTime, nullable=True)  # When the next payout is due
    rules = Column(
        JSON, nullable=True
    )  # Like metatdata that are used to define the rules of the cooperative

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )

    memberships = relationship(
        "GroupMembership",
        back_populates="group",
        foreign_keys=[GroupMembership.group_id],
        overlaps="users,cooperatives",
    )
    users = relationship(
        "User",
        secondary="group_memberships",
        back_populates="cooperatives",
        primaryjoin="CooperativeGroup.id == GroupMembership.group_id",
        secondaryjoin="GroupMembership.user_id == User.id",
        foreign_keys=[GroupMembership.user_id, GroupMembership.group_id],
        overlaps="group,memberships,user",
    )
    ai_insights = relationship(
        "AIInsight", back_populates="group", cascade="all, delete-orphan"
    )
    contributions = relationship(
        "Contribution", back_populates="group", cascade="all, delete-orphan"
    )
    activities = relationship(
        "ActivityLog", back_populates="group", cascade="all, delete-orphan"
    )
