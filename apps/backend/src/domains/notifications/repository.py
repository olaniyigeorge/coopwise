"""Notification domain repository layer."""

# TODO: move notification-specific database access logic into this repository.


class NotificationRepository:
    """Repository for notifications persistence operations."""

    async def create(self, payload: dict):
        raise NotImplementedError()

    async def get_by_user(self, user_id: str):
        raise NotImplementedError()
