from datetime import datetime
from typing import Annotated, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, constr
from uuid import UUID
from db.models.user import IncomeRange, SavingFrequency, UserRoles


PhoneNumberStr = Annotated[str, constr(pattern=r'^\+\d{7,15}$')]  # E.164 format

class UserCreate(BaseModel):
    username: Optional[Annotated[str, constr(min_length=3, max_length=50)]] = None
    email: EmailStr
    password: Annotated[str, constr(min_length=6)]
    full_name: str
    phone_number: PhoneNumberStr  
    role: Optional[UserRoles] = UserRoles.USER

    target_savings_amount: Optional[float] = None
    savings_purpose: Optional[str] = None
    income_range: Optional[IncomeRange] = None
    saving_frequency: Optional[SavingFrequency] = None

class UserUpdate(BaseModel):
    username: Optional[Annotated[str, constr(min_length=3, max_length=50)]] = None
    email: Optional[EmailStr] = None
    password: Optional[Annotated[str, constr(min_length=6)]] = None
    full_name: Optional[str] = None
    phone_number: Optional[PhoneNumberStr] = None  # E.164 international format
    role: Optional[UserRoles] = None

    target_savings_amount: Optional[float] = None
    savings_purpose: Optional[str] = None
    income_range: Optional[IncomeRange] = None
    saving_frequency: Optional[SavingFrequency] = None
    # is_email_verified: Optional[bool] = None
    # is_phone_verified: Optional[bool] = None
    # is_verified: Optional[bool] = None
    # is_video_verified: Optional[bool] = None
    # wallet_activated: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)

class UserDetail(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    full_name: str
    phone_number: PhoneNumberStr
    role: UserRoles
    target_savings_amount: Optional[float] = None
    savings_purpose: Optional[str] = None
    income_range: Optional[IncomeRange] = None
    saving_frequency: Optional[SavingFrequency] = None
    is_email_verified: bool = False
    is_phone_verified: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str

class AuthUser(BaseModel):
    access_token: str
    user: UserDetail


class UserKYC(BaseModel):
    id: UUID
    is_email_verified: bool = False
    is_video_verified: bool = False
    wallet_activated: bool = False
    is_verified: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class UserDetailsAll(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    full_name: str
    phone_number: PhoneNumberStr
    role: UserRoles
    target_savings_amount: Optional[float] = None
    savings_purpose: Optional[str] = None
    income_range: Optional[IncomeRange] = None
    saving_frequency: Optional[SavingFrequency] = None
    is_email_verified: bool = False
    is_phone_verified: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

