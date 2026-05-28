"""Notification domain task definitions."""

# TODO: define Celery tasks and queue orchestration for notification delivery.


def enqueue_notification_task(payload: dict):
    """Enqueue a notification send request to a worker or broker."""
    raise NotImplementedError("Notification task orchestration is not yet implemented.")
