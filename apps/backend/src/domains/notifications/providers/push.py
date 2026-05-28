"""Push notification provider implementation stubs."""

from .base import NotificationProvider
from typing import Any, Dict


class PushProvider(NotificationProvider):
    """Provider for push notification delivery."""

    async def send(self, recipient: str, message: str, metadata: Dict[str, Any]) -> bool:
        # TODO: wire up push notification provider (FCM, APNs, Web Push, etc.)
        return False
