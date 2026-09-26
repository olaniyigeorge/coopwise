"""Notification domain event definitions.

Unused stub: no publisher/subscriber wiring exists yet for notification
lifecycle/retry/audit events. Left unimplemented until that's designed.
"""


class NotificationEvent:
    """Base notification event."""

    def __init__(self, user_id: str, event_type: str, payload: dict):
        self.user_id = user_id
        self.event_type = event_type
        self.payload = payload
