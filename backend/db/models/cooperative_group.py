from datetime import datetime
from uuid import uuid4
from db.models.membership import GroupMembership
from db.database import Base
from sqlalchemy import JSON, Column, String, Enum, DateTime, Numeric, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
import enum


class ContributionFrequency(enum.Enum):
    daily = "daily"
    weekly = "weekly"
    biweekly = "biweekly"   # added
    monthly = "monthly"


class PayoutStrategy(enum.Enum):
    rotating = "rotating"
    equal = "equal"
    priority = "priority"


class CooperativeModel(enum.Enum):
    ajo = "ajo"
    esusu = "esusu"         # added
    adashe = "adashe"       # added
    chama = "chama"         # added
    coop = "coop"


class CooperativeStatus(enum.Enum):
    pending = "pending"     # added — waiting for enough members
    active = "active"
    inactive = "inactive"
    completed = "completed"


class RotationOrder(enum.Enum):            # new
    sequential = "sequential"
    random = "random"


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
    contribution_amount = Column(Numeric, nullable=False)           # local currency (NGN/KES/GHS)
    contribution_frequency = Column(Enum(ContributionFrequency), nullable=False)
    payout_strategy = Column(Enum(PayoutStrategy), nullable=False)
    coop_model = Column(
        Enum(CooperativeModel), default=CooperativeModel.ajo, nullable=False
    )
    target_amount = Column(Numeric, nullable=False)
    status = Column(
        Enum(CooperativeStatus), default=CooperativeStatus.pending, nullable=False
    )
    next_payout_date = Column(DateTime, nullable=True)
    rules = Column(JSON, nullable=True)

    # ── NEW: Chain + wallet fields
    chain_circle_id = Column(Integer, nullable=True, unique=True)   # on-chain UInt64 from Flow
    flow_address = Column(String, nullable=True)                    # creator's Flow address
    currency = Column(String, default="NGN", nullable=False)        # NGN | KES | GHS
    weekly_amount_usdc = Column(Numeric(18, 6), nullable=True)      # USDC equivalent (6 decimals)
    rotation_order = Column(
        Enum(RotationOrder), default=RotationOrder.sequential, nullable=False
    )
    current_round = Column(Integer, default=0, nullable=False)      # which round we're on
    is_complete = Column(Boolean, default=False, nullable=False)
    
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