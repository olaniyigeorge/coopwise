"""
Auth domain schemas (BYOA).

CHANGED vs the Crossmint-Auth version:
  - CrossmintSessionExchange is GONE — no incoming Crossmint JWT.
  - Two-step OTP flow: RequestOtp -> VerifyOtp. full_name is optional on
    VerifyOtp and only enforced by the SERVICE when no existing user is
    found for that identifier (see service.py) — keeping that branch out
    of the schema layer means the 422 the client sees on a missing-name-
    on-registration is a clean, service-level FullNameRequiredError (400),
    not a generic validation error that can't distinguish login vs signup.
  - FirebaseSignIn is NEW — Google sign-in via Firebase ID token.
  - AuthenticatedUser.email is Optional; phone is now a first-class,
    equally-primary identifier alongside email (see product decision:
    both are equal options at signup).
"""
from typing import Annotated, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, constr

from src.domains.auth.ports import OtpChannel
from src.domains.users.models import UserRoles

PhoneNumberStr = Annotated[str, constr(pattern=r"^\+\d{7,15}$")]  # E.164 format


class RequestOtp(BaseModel):
    channel: OtpChannel
    identifier: str  # PhoneNumberStr when channel=phone, EmailStr when channel=email

    model_config = ConfigDict(use_enum_values=True)


class VerifyOtp(BaseModel):
    channel: OtpChannel
    identifier: str
    code: Annotated[str, constr(min_length=4, max_length=8)]
    # Required only for brand-new registrations — enforced in the service,
    # not here, so we can return a precise FullNameRequiredError rather
    # than a generic 422 the client can't act on differently from "bad code".
    full_name: Optional[str] = None

    model_config = ConfigDict(use_enum_values=True)


class FirebaseSignIn(BaseModel):
    firebase_id_token: str
    # Same reasoning as VerifyOtp.full_name — required only on first sight
    # of a given firebase_uid with no email Firebase already gave us.
    full_name: Optional[str] = None

class VerifyOtp(BaseModel):
    channel: str
    identifier: str
    code: str
    full_name: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=8)  # registration only


class PasswordSignIn(BaseModel):
    identifier: str  # email or phone number
    password: str


class AuthenticatedUser(BaseModel):
    """Identity carried on OUR platform JWT, reconstructed on every
    authenticated request."""

    id: UUID
    role: UserRoles
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None


class TokenData(BaseModel):
    id: Optional[UUID] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRoles] = None


class SessionUser(BaseModel):
    id: UUID
    username: str
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    full_name: str
    role: UserRoles
    flow_address: Optional[str] = None  # populated once background provisioning completes
    profile_picture_url: Optional[str] = None
    onboarding_status: str  # "incomplete" | "complete" — informational, not a gate
    is_kyc_verified: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class SessionResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    is_new_user: bool
    user: SessionUser