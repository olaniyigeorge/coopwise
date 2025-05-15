from datetime import datetime
from db.database import Base
from sqlalchemy import Column, Enum, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Session

import enum


# Enum for Membership role
class MembershipRole(enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"


# Enum for Membership status
class MembershipStatus(enum.Enum):
    ACCEPTED = "accepted"
    PENDING = "pending"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class GroupMembership(Base):
    __tablename__ = "group_memberships"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    group_id = Column(PGUUID(as_uuid=True), ForeignKey("cooperative_groups.id"), nullable=False)
    role = Column(Enum(MembershipRole), default=MembershipRole.MEMBER, nullable=False)
    invited_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(MembershipStatus), default=MembershipStatus.PENDING, nullable=False)
    joined_at = Column(DateTime, default=None, nullable=True)

    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)


