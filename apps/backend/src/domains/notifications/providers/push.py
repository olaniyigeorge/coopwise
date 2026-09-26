"""Push notification provider — stubbed. No push gateway (FCM, APNs, Web
Push) is provisioned yet, so this deliberately no-ops until that infra
exists."""

from .base import NotificationProvider
from typing import Any, Dict

from src.shared.utils.logger import logger


class PushProvider(NotificationProvider):
    """Provider for push notification delivery."""

    async def send(
        self, recipient: str, message: str, metadata: Dict[str, Any]
    ) -> bool:
        logger.warning(
            f"[PushProvider] no push gateway configured — dropping message to {recipient}"
        )
        return False
