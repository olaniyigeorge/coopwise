from pydantic import BaseModel, ConfigDict, EmailStr
from uuid import UUID

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str



class UserRead(BaseModel):
    id: UUID
    username: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class UserKYC(BaseModel):
    id: UUID
    is_email_verified: bool = False
    is_video_verified: bool = False
    wallet_activated: bool = False
    is_verified: bool = False
    
    model_config = ConfigDict(from_attributes=True)