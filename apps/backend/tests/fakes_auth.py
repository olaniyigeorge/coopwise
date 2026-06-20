"""
Fakes for every port AuthService depends on.

These aren't mocks with .assert_called_with() — they're small, real
in-memory implementations of the same Protocol, so tests exercise actual
behavior (e.g. "registering twice with the same email really does raise")
rather than just verifying call shapes.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, Optional
from uuid import UUID

from src.domains.auth.exceptions import InvalidTokenError
from src.domains.users.models import User


class FakeUserRepository:
    def __init__(self) -> None:
        self.users: Dict[UUID, User] = {}

    async def get_by_email(self, email: str) -> Optional[User]:
        return next((u for u in self.users.values() if u.email == email), None)

    async def get_by_username(self, username: str) -> Optional[User]:
        return next((u for u in self.users.values() if u.username == username), None)

    async def get_by_phone_number(self, phone_number: Optional[str]) -> Optional[User]:
        if phone_number is None:
            return None
        return next((u for u in self.users.values() if u.phone_number == phone_number), None)

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        return self.users.get(user_id)

    async def get_by_crossmint_user_id(self, crossmint_user_id: str) -> Optional[User]:
        return next(
            (u for u in self.users.values() if u.crossmint_user_id == crossmint_user_id),
            None,
        )

    async def add(self, user: User) -> User:
        if user.id is None:
            from uuid import uuid4

            user.id = uuid4()
        self.users[user.id] = user
        return user

    async def update(self, user: User) -> User:
        self.users[user.id] = user
        return user


class FakePasswordHasher:
    """No real hashing — just a tagged string, so tests stay fast and readable."""

    def hash(self, plain_password: str) -> str:
        return f"hashed::{plain_password}"

    def verify(self, plain_password: str, hashed_password: str) -> bool:
        return hashed_password == f"hashed::{plain_password}"


class FakeTokenService:
    """
    Encodes claims into a fake token string (no real JWT signing) and keeps
    a lookup table so decode() can return exactly what was encoded. This
    avoids dragging `jose` and real signing/expiry math into unit tests
    while still letting us assert on claim contents.
    """

    def __init__(self) -> None:
        self._store: Dict[str, dict] = {}
        self._counter = 0

    def encode(self, claims: dict, expires_delta: timedelta) -> str:
        self._counter += 1
        token = f"faketoken-{self._counter}"
        normalized = dict(claims)
        if isinstance(normalized.get("exp"), datetime):
            # Mirrors real jose/jwt behavior: datetime exp claims are
            # converted to a numeric timestamp at encode time.
            normalized["exp"] = normalized["exp"].timestamp()
        self._store[token] = normalized
        return token

    def decode(self, token: str) -> dict:
        if token not in self._store:
            raise InvalidTokenError("Invalid credentials")
        return self._store[token]


class FakeClock:
    def __init__(self, now: Optional[datetime] = None) -> None:
        self._now = now or datetime(2026, 1, 1, 12, 0, 0)

    def now(self) -> datetime:
        return self._now

    def advance(self, delta: timedelta) -> None:
        self._now += delta


class FakeAuthNotifier:
    def __init__(self) -> None:
        self.registered_calls: list[User] = []
        self.wallet_linked_calls: list[tuple[User, str]] = []

    async def notify_user_registered(self, user: User) -> None:
        self.registered_calls.append(user)

    async def notify_wallet_linked(self, user: User, flow_address: str) -> None:
        self.wallet_linked_calls.append((user, flow_address))
