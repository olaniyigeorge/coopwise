"""SMS provider implementation stubs."""

from .base import NotificationProvider
from typing import Any, Dict


class SMSProvider(NotificationProvider):
    """Provider for SMS-based notification delivery."""

    async def send(self, recipient: str, message: str, metadata: Dict[str, Any]) -> bool:
        # TODO: wire up SMS gateway provider (Twilio, Vonage, etc.)
        return False
