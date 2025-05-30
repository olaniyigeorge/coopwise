from datetime import datetime
from db.database import Base
from sqlalchemy import Boolean, Column, Enum, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

import enum


# Enum for Membership role
class MembershipRole(enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"


# Enum for Membership status
class MembershipStatus(enum.Enum):
    CLICKED = "clicked"
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
    invite_code = Column(String, nullable=True)
    invited_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(MembershipStatus), default=MembershipStatus.CLICKED, nullable=False)
    joined_at = Column(DateTime, default=None, nullable=True)

    payout_position = Column(Integer, default=0, nullable=False)  # Position in the payout queue

    has_received_payout_this_cycle = Column(Boolean, default=False)


    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    user = relationship("User", back_populates="memberships", foreign_keys=[user_id])
    inviter = relationship("User", back_populates="invited_memberships", foreign_keys=[invited_by])
    group = relationship("CooperativeGroup", back_populates="memberships", overlaps="users")

