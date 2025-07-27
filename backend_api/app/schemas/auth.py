from uuid import UUID
from pydantic import BaseModel, EmailStr

from db.models.user import UserRoles


class AuthenticatedUser(BaseModel):
    id: UUID
    role: UserRoles
    email: EmailStr
