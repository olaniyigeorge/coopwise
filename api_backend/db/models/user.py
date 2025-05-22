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
    ADMIN = "admin"
    USER = "user"

# Enum for Saving Frequency
class SavingFrequency(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class IncomeRange(enum.Enum):
    BELOW_50K = "Below 50K"
    RANGE_50K_100K = "50K - 100K"
    RANGE_100K_200K = "100K - 200K"
    RANGE_200K_350K = "200K - 350K"
    RANGE_350K_500K = "350K - 500K"
    ABOVE_500K = "500K and above"


class User(Base):
    __tablename__ = "users"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=lambda: str(uuid4()), index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)  
    password = Column(String, unique=True, index=True, nullable=False) 
    full_name = Column(String, nullable=False)  
    phone_number = Column(String(16), unique=True, nullable=False, index=True)
    
    role = Column(Enum(UserRoles), default=UserRoles.USER)

    # ##### Onboarding & preference
    target_savings_amount = Column(Float, nullable=True)  # e.g., 500000.0
    savings_purpose = Column(String, nullable=True)  # e.g., "Sheila's tuition"
    income_range = Column(Enum(IncomeRange), nullable=True)
    saving_frequency = Column(Enum(SavingFrequency), nullable=True)  # e.g., "monthly"
    
    # Verification Flags
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    memberships = relationship(
        "GroupMembership", 
        back_populates="user", 
        foreign_keys="GroupMembership.user_id"
    )
    cooperatives = relationship(
        "CooperativeGroup",
        secondary="group_memberships",
        back_populates="users",
        primaryjoin="User.id == GroupMembership.user_id",
        secondaryjoin="GroupMembership.group_id == CooperativeGroup.id",
        foreign_keys=[GroupMembership.user_id, GroupMembership.group_id],
        overlaps="memberships,user"
    )
    
    invited_memberships = relationship(
        "GroupMembership",
        back_populates="inviter",
        foreign_keys="GroupMembership.invited_by"
    )