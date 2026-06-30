"""
Auth domain schemas.
  - AuthenticatedUser.email is now Optional — a user who signed up via
    Crossmint SMS may have no email on file at all.
"""
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

from src.domains.users.models import UserRoles


class CrossmintSessionExchange(BaseModel):
    """
    POST body for exchanging a verified Crossmint session for a CoopWise
    platform session. This is the ONLY auth entrypoint for end users.

    crossmint_jwt: the JWT issued by Crossmint's client SDK after the user
        completes email OTP / Google / SMS login. Mirrors the cookie key
        `crossmint-jwt` Crossmint's own SSR examples use.
    crossmint_refresh_token: mirrors `crossmint-refresh-token`. Optional —
        if omitted we just verify the JWT as-is; if present and the JWT is
        stale, the verifier can refresh it the same way Crossmint's own
        getSession() does server-side.
    """

    crossmint_jwt: str
    crossmint_refresh_token: Optional[str] = None


class AuthenticatedUser(BaseModel):
    """Identity carried on OUR platform JWT, reconstructed by the request
    pipeline on every authenticated call. Not the Crossmint identity."""

    id: UUID
    role: UserRoles
    email: Optional[EmailStr] = None


class TokenData(BaseModel):
    id: Optional[UUID] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRoles] = None


class SessionUser(BaseModel):
    """User payload embedded in the session response."""

    id: UUID
    username: str
    email: Optional[EmailStr] = None
    full_name: str
    phone_number: Optional[str] = None
    role: UserRoles
    flow_address: Optional[str] = None
    crossmint_user_id: Optional[str] = None
    profile_picture_url: Optional[str] = None
    onboarding_status: str  # "incomplete" | "complete" — informational, not a gate

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    """Response of POST /api/v1/auth/session — our platform tokens, not Crossmint's."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: SessionUser