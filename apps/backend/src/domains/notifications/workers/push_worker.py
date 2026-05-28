"""Push notification worker for notifications."""

from apps.backend.src.domains.notifications.providers.push import PushProvider


class PushWorker:
    """Worker responsible for dispatching push notifications asynchronously."""

    async def process(self, payload: dict) -> bool:
        provider = PushProvider()
        return await provider.send(payload["recipient"], payload["message"], payload)
