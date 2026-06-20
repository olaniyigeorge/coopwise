"""
Ports for the auth domain.

These are Protocols (structural typing) rather than ABCs so that:
  - real adapters (SQLAlchemy, jose, passlib, NotificationService) don't need
    to inherit from anything, they just need to match the shape.
  - test fakes are plain classes with no base-class boilerplate.

AuthService depends ONLY on these interfaces, never on SQLAlchemy, jose,
or the notifications domain's concrete service. This is what makes it
unit-testable without a database or network calls.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional, Protocol, runtime_checkable
from uuid import UUID

from src.domains.users.models import User


@runtime_checkable
class UserRepository(Protocol):
    """Persistence boundary for User. No SQLAlchemy types leak past this."""

    async def get_by_email(self, email: str) -> Optional[User]: ...

    async def get_by_username(self, username: str) -> Optional[User]: ...

    async def get_by_phone_number(self, phone_number: str) -> Optional[User]: ...

    async def get_by_id(self, user_id: UUID) -> Optional[User]: ...

    async def get_by_crossmint_user_id(self, crossmint_user_id: str) -> Optional[User]: ...

    async def add(self, user: User) -> User:
        """Persist a new user and return it with DB-generated fields populated."""
        ...

    async def update(self, user: User) -> User:
        """Persist mutations to an existing, already-attached user."""
        ...


class PasswordHasherPort(Protocol):
    def hash(self, plain_password: str) -> str: ...

    def verify(self, plain_password: str, hashed_password: str) -> bool: ...


class TokenServicePort(Protocol):
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
    The real adapter translates that into whatever the notifications domain
    needs (queue, DLQ, provider routing, etc. per the notification system spec).
    """

    async def notify_user_registered(self, user: User) -> None: ...

    async def notify_wallet_linked(self, user: User, flow_address: str) -> None: ...
