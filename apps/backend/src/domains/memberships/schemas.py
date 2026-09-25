from uuid import UUID
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

from src.domains.users.schemas import UserDetail
from src.domains.memberships.models.enums import MembershipRole, MembershipStatus


class MembershipCreate(BaseModel):
    user_id: Optional[UUID] = None  # UUID as string
    group_id: UUID  # UUID as string
    invited_by: UUID
    role: MembershipRole
    status: MembershipStatus
    payout_position: int = 1


class AcceptMembership(BaseModel):
    invited_by: UUID
    role: Optional[MembershipRole] = None
    joined_at: Optional[datetime] = None
    status: Optional[MembershipStatus] = None


class MembershipDetails(BaseModel):
    # Matches the real GroupMembership ORM columns — id is a UUID (not int),
    # and there's no invited_by column (that lives only on the separate,
    # not-yet-wired-up CoopInvitation model). status is a plain str: the
    # column mixes two vocabularies at runtime — MembershipStatus values
    # ("active", from cooperative auto-enrollment) and invite-lifecycle
    # values ("clicked"/"pending"/"accepted"/...) — no single enum covers
    # both, and the DB column itself has no CHECK constraint.
    id: UUID
    user_id: UUID | None  # None means its still an invite
    group_id: UUID  # UUID as string
    role: MembershipRole
    status: str
    joined_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MembershipExtDetails(MembershipDetails):
    user: UserDetail

    model_config = ConfigDict(from_attributes=True)


class CircleMemberDetail(BaseModel):
    # From GroupMembership
    user_id: UUID
    group_id: UUID
    role: str  # MembershipRole enum value
    status: str  # MembershipStatus enum value
    payout_position: int  # position in the payout queue
    has_received_payout_this_cycle: bool
    joined_at: Optional[datetime] = None

    # From User (joined)
    full_name: str
    username: str
    profile_picture_url: Optional[str] = None
    flow_address: Optional[str] = None
    is_email_verified: bool = False

    # Computed by the service (not from ORM directly)
    has_contributed_this_round: bool = False

    model_config = ConfigDict(from_attributes=True)
