from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.notifications.schemas import NotificationCreate
from src.domains.notifications.service import NotificationService
from src.domains.users.models import User


class NotificationServiceAuthNotifier:
    """
    Adapts the notifications domain's NotificationService to the narrow
    AuthNotifierPort the auth domain depends on. This is the ONLY file
    in the auth domain that imports anything from src.domains.notifications.

    CHANGED vs the password-auth version: notify_wallet_linked is dropped.
    Wallet linking is no longer a client-driven event we sync on — wallet
    provisioning happens entirely on Crossmint's side, invisibly, as part
    of normal session exchange. If/when we want a "wallet ready" notification,
    it should be driven by a server-to-server Crossmint webhook, not by a
    client POST.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def notify_user_registered(self, user: User) -> None:
        noti_data = NotificationCreate(
            user_id=user.id,
            title="Welcome to CoopWise",
            message="Your account is ready. Let's get saving.",
            event_type="general_alert",
            type="info",
            entity_url=None,
        )
        await NotificationService.create_and_push_notification_to_user(noti_data, self._db)