"""Email provider implementation stubs."""

from .base import NotificationProvider
from typing import Any, Dict


class EmailProvider(NotificationProvider):
    """Provider for email-based notification delivery."""

    async def send(self, recipient: str, message: str, metadata: Dict[str, Any]) -> bool:
        # TODO: wire up email provider (SMTP, transactional email API, templates)
        return False
