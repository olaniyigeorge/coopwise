"""
Ports for the auth domain — Bring Your Own Auth (BYOA).

CHANGED vs the Crossmint-Auth version of this file:
  - CrossmintVerifierPort is GONE. We no longer receive or verify a
    Crossmint-issued JWT — there isn't one. We ARE the identity provider:
    phone OTP, email OTP, and Google-via-Firebase are all verified by us,
    and Crossmint is registered in their console to trust OUR JWT (the
    "custom tokens" BYOA option), used purely to provision a wallet
    against an already-authenticated user. See infra/wallet_provider.py.
  - OtpSenderPort / OtpStorePort / FirebaseVerifierPort are NEW — these
    are the actual identity-verification trust boundaries now.
  - WalletProviderPort is NEW and intentionally narrow: provision_wallet
    is the only method, called from a background task (Celery) after
    session issuance, never inline in the auth request path. A wallet
    provisioning failure must never block or fail a login/registration.

Why Protocols (structural typing) instead of ABCs: real adapters (Redis,
Termii/Africa's Talking, Resend, Firebase Admin SDK, Crossmint's API)
don't need to inherit from anything, and test fakes are plain classes
with no base-class boilerplate. AuthService depends ONLY on these
interfaces, never on redis, httpx, firebase_admin, etc. directly.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Protocol, runtime_checkable
from uuid import UUID

from src.domains.users.models import User


class OtpChannel(str, Enum):
    phone = "phone"
    email = "email"


@dataclass(frozen=True)
class FirebaseIdentity:
    """Result of verifying a Firebase ID token (Google sign-in via Firebase).
    Everything here came from Firebase Admin SDK's verified token claims —
    never from a client-submitted field."""

    firebase_uid: str
    email: Optional[str] = None
    email_verified: bool = False
    full_name: Optional[str] = None
    picture_url: Optional[str] = None


@runtime_checkable
class OtpSenderPort(Protocol):
    """One implementation per channel (phone -> SMS provider, email ->
    Resend or similar). Same interface regardless of provider, so swapping
    Termii for Africa's Talking later is an infra-only change."""

    channel: OtpChannel

    async def send_otp(self, identifier: str, code: str) -> None:
        """identifier is an E.164 phone number or an email address,
        matching `channel`. Raises OtpDeliveryError (domain exception) on
        provider failure (bad number, provider outage, etc.)."""
        ...


@runtime_checkable
class OtpStorePort(Protocol):
    """
    Redis-backed (reuses the Redis connection already wired for
    CashRampService — see api/middlewares/dependencies.get_redis). Owns
    code generation, TTL, one-time consumption, and request rate-limiting.
    Deliberately separate from OtpSenderPort: rate-limit logic shouldn't
    be duplicated per-provider, and this lets us swap Termii/Africa's
    Talking/Resend without touching throttling or storage at all.
    """

    async def issue_code(self, channel: OtpChannel, identifier: str) -> str:
        """Generates and stores a new OTP code, returns it for sending.
        Raises OtpRateLimitedError if this identifier has requested too
        many codes too recently."""
        ...

    async def verify_and_consume(
        self, channel: OtpChannel, identifier: str, code: str
    ) -> bool:
        """Returns True and invalidates the code on a correct, unexpired
        match. Returns False on mismatch/expiry/already-used — callers
        must not distinguish these in user-facing responses (avoids
        leaking whether a code ever existed)."""
        ...


@runtime_checkable
class FirebaseVerifierPort(Protocol):
    """Trust boundary for Google-via-Firebase sign-in."""

    async def verify_id_token(self, firebase_id_token: str) -> FirebaseIdentity:
        """Raises FirebaseVerificationError on any failure: bad signature,
        expired, wrong project, malformed token."""
        ...


@runtime_checkable
class WalletProviderPort(Protocol):
    """
    Narrow boundary around Crossmint's BYOA custom-token wallet
    provisioning. ONE method. Called from a background task after a
    session already exists — never inline in login/registration, and a
    failure here must never surface as an auth failure to the user.
    """

    async def provision_wallet(self, user_id: UUID, platform_jwt: str) -> str:
        """Returns the provisioned wallet address. platform_jwt is OUR
        token (the one whose signing key is registered in Crossmint's
        console under JWT Authentication > Custom tokens) — Crossmint
        extracts user_id from it and assigns wallet ownership accordingly.
        Raises WalletProvisioningError on failure."""
        ...


@runtime_checkable
class UserRepository(Protocol):
    """Persistence boundary for User. No SQLAlchemy types leak past this."""

    async def get_by_id(self, user_id: UUID) -> Optional[User]: ...

    async def get_by_phone_number(self, phone_number: str) -> Optional[User]: ...

    async def get_by_email(self, email: str) -> Optional[User]: ...

    async def get_by_firebase_uid(self, firebase_uid: str) -> Optional[User]: ...

    async def add(self, user: User) -> User:
        """Persist a new user and return it with DB-generated fields populated."""
        ...

    async def update(self, user: User) -> User:
        """Persist mutations to an existing, already-attached user."""
        ...


class TokenServicePort(Protocol):
    """Mints/verifies OUR platform JWT — the only identity token in this
    system. Its signing key is what's registered with Crossmint's console
    for BYOA custom-token wallet provisioning."""

    def encode(self, claims: dict, expires_delta: timedelta) -> str: ...

    def decode(self, token: str) -> dict:
        """Raises InvalidTokenError (domain exception) on failure/expiry."""
        ...


class PasswordHasherPort(Protocol):
    def hash(self, password: str) -> str: ...
    def verify(self, password: str, hashed: str) -> bool: ...

class ClockPort(Protocol):
    def now(self) -> datetime: ...


class AuthNotifierPort(Protocol):
    """
    Narrow notification boundary for the auth domain. Auth never imports
    notifications.service or builds NotificationCreate payloads directly.
    """

    async def notify_user_registered(self, user: User) -> None: ...