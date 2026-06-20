from __future__ import annotations

from datetime import datetime, timezone

from src.shared.utils.crypto import get_password_hash, verify_password


class PasslibPasswordHasher:
    """Thin adapter over the existing src.shared.utils.crypto functions."""

    def hash(self, plain_password: str) -> str:
        return get_password_hash(plain_password)

    def verify(self, plain_password: str, hashed_password: str) -> bool:
        return verify_password(plain_password, hashed_password)


class SystemClock:
    """Real wall-clock. Swapped for a FakeClock in tests for deterministic expiry."""

    def now(self) -> datetime:
        return datetime.now(timezone.utc)
