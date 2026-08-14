"""
Fakes for every port AuthService depends on (BYOA version).

Real in-memory implementations of each Protocol in src/domains/auth/ports.py,
not call-shape mocks — so e.g. "OTP code round-trips through issue/verify"
and "existing user found by email fallback" are actually exercised.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from uuid import UUID, uuid4
import itertools


from src.domains.auth.exceptions import InvalidTokenError
from src.domains.auth.ports import FirebaseIdentity, OtpChannel
from src.domains.users.models import User, UserRoles

_token_counter = itertools.count(1)


class FakeUserRepository:
    def __init__(self) -> None:
        self.users: Dict[UUID, User] = {}

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        return self.users.get(user_id)

    async def get_by_phone_number(self, phone_number: str) -> Optional[User]:
        return next(
            (u for u in self.users.values() if u.phone_number == phone_number), None
        )

    async def get_by_email(self, email: str) -> Optional[User]:
        return next((u for u in self.users.values() if u.email == email), None)

    async def get_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        return next(
            (u for u in self.users.values() if u.firebase_uid == firebase_uid), None
        )

    async def add(self, user: User) -> User:
        if user.id is None:
            user.id = uuid4()
        self.users[user.id] = user
        return user

    async def update(self, user: User) -> User:
        self.users[user.id] = user
        return user

    def seed(self, **overrides) -> User:
        """Directly plant an existing user, bypassing the service, for
        tests that need a pre-existing account."""
        defaults = dict(
            id=uuid4(),
            username=f"user_{uuid4().hex[:6]}",
            email=None,
            phone_number=None,
            full_name="Existing User",
            role=UserRoles.user,
            password=None,
            firebase_uid=None,
            is_email_verified=False,
            is_phone_verified=False,
            profile_picture_url=None,
            flow_address=None,
            is_kyc_verified=False,
            target_savings_amount=None,
            savings_purpose=None,
            income_range=None,
            saving_frequency=None,
        )
        defaults.update(overrides)
        user = User(**defaults)
        self.users[user.id] = user
        return user


class FakeOtpStore:
    """In-memory code issue/verify-and-consume, one active code per
    (channel, identifier). No rate limiting — not exercised by these tests."""

    def __init__(self) -> None:
        self._codes: Dict[Tuple[OtpChannel, str], str] = {}
        self._counter = 0

    async def issue_code(self, channel: OtpChannel, identifier: str) -> str:
        self._counter += 1
        code = f"{self._counter:06d}"
        self._codes[(channel, identifier)] = code
        return code

    async def verify_and_consume(
        self, channel: OtpChannel, identifier: str, code: str
    ) -> bool:
        key = (channel, identifier)
        if self._codes.get(key) != code:
            return False
        del self._codes[key]
        return True


class FakeOtpSender:
    """One instance per channel, matching otp_senders: dict[OtpChannel, OtpSenderPort]."""

    def __init__(self, channel: OtpChannel) -> None:
        self.channel = channel
        self.sent: list[tuple[str, str]] = []  # (identifier, code)

    async def send_otp(self, identifier: str, code: str) -> None:
        self.sent.append((identifier, code))


class FakeFirebaseVerifier:
    """Tokens must be pre-registered via `register`; anything else raises,
    which AuthService wraps into FirebaseVerificationError."""

    def __init__(self) -> None:
        self._tokens: Dict[str, FirebaseIdentity] = {}

    def register(self, token: str, identity: FirebaseIdentity) -> None:
        self._tokens[token] = identity

    async def verify_id_token(self, firebase_id_token: str) -> FirebaseIdentity:
        if firebase_id_token not in self._tokens:
            raise ValueError("unrecognized firebase token")
        return self._tokens[firebase_id_token]


class FakeTokenService:
    def __init__(self) -> None:
        self._store: Dict[str, dict] = {}

    def encode(self, claims: dict, expires_delta: timedelta) -> str:
        token = f"faketoken-{next(_token_counter)}"
        normalized = dict(claims)
        if isinstance(normalized.get("exp"), datetime):
            normalized["exp"] = normalized["exp"].timestamp()
        self._store[token] = normalized
        return token

    def decode(self, token: str) -> dict:
        if token not in self._store:
            raise InvalidTokenError("Invalid credentials")
        return self._store[token]


class FakePasswordHasher:
    def hash(self, password: str) -> str:
        return f"hashed::{password}"

    def verify(self, password: str, hashed: str) -> bool:
        return hashed == f"hashed::{password}"


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

    async def notify_user_registered(self, user: User) -> None:
        self.registered_calls.append(user)
