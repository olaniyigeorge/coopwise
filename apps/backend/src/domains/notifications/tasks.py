"""Notification domain task definitions.

Unused stub: celery_app (src/infra/celery/app.py) already declares
push/sms/email queues and routes deliver_push/deliver_sms/deliver_email
task names here, but those tasks don't exist yet — nothing currently
publishes to them (in-app notifications go through NotificationService's
direct DB + websocket push instead). Wire actual @celery_app.task
functions here (using EmailProvider/SMSProvider/PushProvider) when this
delivery path is needed.
"""


def enqueue_notification_task(payload: dict):
    """Enqueue a notification send request to a worker or broker."""
    raise NotImplementedError("Notification task orchestration is not yet implemented.")
