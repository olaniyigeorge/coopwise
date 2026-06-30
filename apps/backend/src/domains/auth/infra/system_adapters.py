from __future__ import annotations

from datetime import datetime, timezone


class SystemClock:
    """Real wall-clock. Swapped for a FakeClock in tests for deterministic expiry."""

    def now(self) -> datetime:
        return datetime.now(timezone.utc)