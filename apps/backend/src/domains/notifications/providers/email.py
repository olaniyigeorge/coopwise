"""Email provider implementation — delivers via Resend (src.infra.emails)."""

from .base import NotificationProvider
from typing import Any, Dict

from src.infra.emails.deps import build_email_sender
from src.infra.emails.exceptions import EmailSendError
from src.shared.utils.logger import logger


class EmailProvider(NotificationProvider):
    """Provider for email-based notification delivery."""

    async def send(
        self, recipient: str, message: str, metadata: Dict[str, Any]
    ) -> bool:
        subject = metadata.get("subject", "CoopWise notification")
        html = metadata.get("html", message)
        try:
            sender = build_email_sender()
            await sender.send(to=recipient, subject=subject, html=html)
            return True
        except EmailSendError as e:
            logger.error(f"[EmailProvider] send failed to {recipient}: {e}")
            return False
