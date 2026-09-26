"""Notification domain repository layer.

Unused stub: NotificationService (service.py) does its DB access directly
today. Left unimplemented pending a decision to move that access here.
"""


class NotificationRepository:
    """Repository for notifications persistence operations."""

    async def create(self, payload: dict):
        raise NotImplementedError()

    async def get_by_user(self, user_id: str):
        raise NotImplementedError()
