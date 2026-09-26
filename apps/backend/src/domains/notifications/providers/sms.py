"""SMS provider — stubbed. No SMS gateway (Twilio, Vonage, etc.) is
provisioned yet, so this deliberately no-ops until that infra exists."""

from .base import NotificationProvider
from typing import Any, Dict

from src.shared.utils.logger import logger


class SMSProvider(NotificationProvider):
    """Provider for SMS-based notification delivery."""

    async def send(
        self, recipient: str, message: str, metadata: Dict[str, Any]
    ) -> bool:
        logger.warning(
            f"[SMSProvider] no SMS gateway configured — dropping message to {recipient}"
        )
        return False
