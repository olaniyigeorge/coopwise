from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

from db.models.user import UserRoles


class AuthenticatedUser(BaseModel):
    id: UUID
    role: UserRoles
    email: EmailStr
    flow_address: Optional[str] = None



class TokenData(BaseModel):
    id: Optional[UUID] = None
    full_name: Optional[str] = None
    email: Optional[str] =  None
    role: Optional[UserRoles] = None