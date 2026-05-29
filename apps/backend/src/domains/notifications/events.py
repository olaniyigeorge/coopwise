"""Notification domain event definitions."""

# TODO: implement event payloads for notification lifecycle, retry events, and audit trail.


class NotificationEvent:
    """Base notification event."""

    def __init__(self, user_id: str, event_type: str, payload: dict):
        self.user_id = user_id
        self.event_type = event_type
        self.payload = payload
