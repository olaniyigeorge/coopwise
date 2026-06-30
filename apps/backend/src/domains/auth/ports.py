"""
Ports for the auth domain.

These are Protocols (structural typing) rather than ABCs so that:
  - real adapters (SQLAlchemy, jose, httpx, NotificationService) don't need
    to inherit from anything, they just need to match the shape.
  - test fakes are plain classes with no base-class boilerplate.

AuthService depends ONLY on these interfaces, never on SQLAlchemy, jose,
httpx, or the notifications domain's concrete service. This is what makes
it unit-testable without a database or network calls.

CHANGED vs the password-auth version of this file:
  - PasswordHasherPort is GONE. CoopWise has no local passwords. Crossmint
    is the sole identity provider for end users (email OTP / Google / SMS,
    all surfaced through Crossmint's hosted auth — see auth domain README).
  - CrossmintVerifierPort is NEW. This is the actual trust boundary of the
    whole domain: it is the only thing allowed to assert "this JWT really
    came from Crossmint and really means this crossmint_user_id". Nothing
    else in the service ever trusts client-submitted identity fields.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional, Protocol, runtime_checkable
from uuid import UUID

from src.domains.users.models import User


@dataclass(frozen=True)
class CrossmintIdentity:
    """
    Result of verifying a Crossmint session. Everything here came from a
    cryptographically verified JWT or a server-to-server call authenticated
    with OUR Crossmint server API key — never from a client-submitted field.
    """

    crossmint_user_id: str
    email: Optional[str] = None
    phone_number: Optional[str] = None


@runtime_checkable
class CrossmintVerifierPort(Protocol):
    """
    Trust boundary for Crossmint. The ONLY source of truth for "who is this
    user, according to Crossmint". Implementations must verify JWT signature,
    issuer, audience, and expiry against Crossmint's published JWKS before
    returning anything.
    """

    async def verify_session(
        self, jwt: str, refresh_token: Optional[str] = None
    ) -> CrossmintIdentity:
        """
        Verify a Crossmint session JWT (optionally refreshing it using the
        refresh token, mirroring Crossmint's own getSession semantics).
        Raises CrossmintVerificationError (domain exception) on any failure:
        bad signature, expired, wrong issuer/audience, malformed token.
        """
        ...

    async def fetch_profile(self, crossmint_user_id: str) -> CrossmintIdentity:
        """
        Server-to-server profile refresh via Crossmint's getUser-equivalent
        REST call, authenticated with our server API key. Used when we want
        fresher email/phone data than what's in a possibly-stale JWT.
        """
        ...


@runtime_checkable
class UserRepository(Protocol):
    """Persistence boundary for User. No SQLAlchemy types leak past this."""

    async def get_by_id(self, user_id: UUID) -> Optional[User]: ...

    async def get_by_crossmint_user_id(self, crossmint_user_id: str) -> Optional[User]: ...

    async def get_by_email(self, email: str) -> Optional[User]:
        """Used only as a soft fallback match during first-time provisioning."""
        ...

    async def add(self, user: User) -> User:
        """Persist a new user and return it with DB-generated fields populated."""
        ...

    async def update(self, user: User) -> User:
        """Persist mutations to an existing, already-attached user."""
        ...


class TokenServicePort(Protocol):
    """Mints/verifies OUR platform JWT — distinct from Crossmint's JWT."""

    def encode(self, claims: dict, expires_delta: timedelta) -> str: ...

    def decode(self, token: str) -> dict:
        """Raises InvalidTokenError (domain exception) on failure/expiry."""
        ...


class ClockPort(Protocol):
    def now(self) -> datetime: ...


class AuthNotifierPort(Protocol):
    """
    Narrow notification boundary for the auth domain.

    Auth should never import notifications.service or build NotificationCreate
    payloads directly — it just announces "this happened" through this port.
    """

    async def notify_user_registered(self, user: User) -> None: ...