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
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def notify_user_registered(self, user: User) -> None:
        noti_data = NotificationCreate(
            user_id=user.id,
            title="Sign up Successful",
            message="Welcome to Coopwise",
            event_type="general_alert",
            type="info",
            entity_url=None,
        )
        await NotificationService.create_and_push_notification_to_user(noti_data, self._db)

    async def notify_wallet_linked(self, user: User, flow_address: str) -> None:
        try:
            noti_data = NotificationCreate(
                user_id=user.id,
                title=f"Wallet {flow_address} Successfully Linked To Account",
                message=f"Welcome to Coopwise {user.full_name}",
                event_type="general_alert",
                type="info",
                entity_url=None,
            )
            await NotificationService.create_and_push_notification_to_user(noti_data, self._db)
        except Exception as e:
            # Preserves original router behavior: notification failure is non-fatal
            # for a wallet sync.
            from src.shared.utils.logger import logger

            logger.error(f"[flow_sync] Notification failed (non-fatal): {e}")
