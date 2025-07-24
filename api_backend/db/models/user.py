from datetime import datetime
from uuid import uuid4
from db.models.membership import GroupMembership
from db.database import Base
from sqlalchemy import Boolean, Column, String, Enum, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
import enum


# Enum for User Roles
class UserRoles(enum.Enum):
    admin = "admin"
    user = "user"


# Enum for Saving Frequency
class SavingFrequency(enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


class IncomeRange(enum.Enum):
    below_50k = "below_50k"
    range_50k_100k = "range_50k_100k"
    range_100k_200k = "range_100k_200k"
    range_200k_350k = "range_200k_350k"
    range_350k_500k = "range_350k_500k"
    above_500k = "above_500k"


class User(Base):
    __tablename__ = "users"
    id = Column(
        PGUUID(as_uuid=True), primary_key=True, default=lambda: uuid4(), index=True
    )
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String(16), unique=True, nullable=False, index=True)
    profile_picture_url = Column(String, nullable=True)

    role = Column(Enum(UserRoles), default=UserRoles.user)

    #  Onboarding & preference
    target_savings_amount = Column(Float, nullable=True)
    savings_purpose = Column(String, nullable=True)
    income_range = Column(Enum(IncomeRange), nullable=True)
    saving_frequency = Column(Enum(SavingFrequency), nullable=True)

    # Verification Flags
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )

    # ------------- Relationships -------------
    memberships = relationship(
        "GroupMembership",
        back_populates="user",
        foreign_keys="GroupMembership.user_id",
        overlaps="cooperatives,users",
    )
    cooperatives = relationship(
        "CooperativeGroup",
        secondary="group_memberships",
        back_populates="users",
        primaryjoin="User.id == GroupMembership.user_id",
        secondaryjoin="GroupMembership.group_id == CooperativeGroup.id",
        foreign_keys=[GroupMembership.user_id, GroupMembership.group_id],
        overlaps="memberships,group,user",
    )
    invited_memberships = relationship(
        "GroupMembership",
        back_populates="inviter",
        foreign_keys="GroupMembership.invited_by",
    )
    notifications = relationship(
        "Notification",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    ai_insights = relationship("AIInsight", back_populates="user", lazy="selectin")
    contributions = relationship(
        "Contribution", back_populates="user", cascade="all, delete-orphan"
    )
    activities = relationship(
        "ActivityLog", back_populates="user", cascade="all, delete-orphan"
    )
    bank_accounts = relationship(
        "BankAccount", back_populates="user", cascade="all, delete-orphan"
    )
    wallet = relationship("Wallet", back_populates="user", cascade="all, delete-orphan")
    # ai_chats = relationship(
    #     "ChatWithAI",
    #     back_populates="user",
    #     cascade="all, delete-orphan",
    #     lazy="selectin"
    # )


from db.models.ai_chat_model import ChatWithAI

User.ai_chats = relationship(
    "ChatWithAI", back_populates="user", cascade="all, delete-orphan"
)
