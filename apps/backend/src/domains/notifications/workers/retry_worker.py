"""Retry worker for notification delivery.

Unused stub: no delivery pipeline calls this yet (see tasks.py). Left
unimplemented — retry/backoff/DLQ policy should follow whatever queue
design tasks.py ends up with, not be guessed ahead of it.
"""


class RetryWorker:
    """Worker responsible for retrying failed notification deliveries."""

    async def process(self, payload: dict) -> bool:
        return False
