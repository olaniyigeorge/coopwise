from uuid import UUID
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

from app.schemas.user import UserDetail
from db.models.membership import MembershipRole, MembershipStatus



class MembershipCreate(BaseModel):
    user_id: Optional[UUID] = None  # UUID as string
    group_id: UUID  # UUID as string
    invited_by: UUID
    role: MembershipRole
    status: MembershipStatus




class AcceptMembership(BaseModel):
    invited_by: UUID
    role: Optional[MembershipRole] = None
    joined_at: Optional[datetime] = None
    status: Optional[MembershipStatus] = None


class MembershipDetails(BaseModel):
    id: int
    user_id: UUID | None  # None means its still an invite
    group_id: UUID  # UUID as string
    role: MembershipRole
    invited_by: UUID
    status: MembershipStatus
    joined_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MembershipExtDetails(MembershipDetails):
    user: UserDetail
    
    model_config = ConfigDict(from_attributes=True)