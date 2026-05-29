import sys
from pathlib import Path
from celery import Celery
from celery.schedules import crontab

from config import AppConfig

# Path setup 
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Celery instance 
celery_app = Celery(
    AppConfig.PROJECT_NAME,
    broker=AppConfig.REDIS_URL,  # uses CELERY_BROKER_URL via env override
    backend=AppConfig.REDIS_URL,
    include=[
        "src.domains.notifications.tasks",  # deliver_notification, review_manual_queue
    ],
)

# Queue routing 
# One queue per channel so worker pools are independent and channel failures
# don't block each other.
celery_app.conf.task_routes = {
    "src.domains.notifications.tasks.deliver_push":          {"queue": "push"},
    "src.domains.notifications.tasks.deliver_sms":           {"queue": "sms"},
    "src.domains.notifications.tasks.deliver_email":         {"queue": "email"},
    "src.domains.notifications.tasks.review_manual_queue":   {"queue": "celery"},  # default queue
}

# Beat schedule 
celery_app.conf.beat_schedule = {
    # Surfaces manual_review notifications to ops every 15 minutes
    "dlq-review-every-15min": {
        "task": "src.domains.notifications.tasks.review_manual_queue",
        "schedule": crontab(minute="*/15"),
    },
    # Contribution reminders — checks for contributions due in 24hrs, every hour
    "contribution-reminders-every-hour": {
        "task": "src.domains.notifications.tasks.send_contribution_reminders",
        "schedule": crontab(minute=0, hour="*"),
    },
}

# General config 
celery_app.conf.update(
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,            # hard kill after 5 min
    task_soft_time_limit=240,       # SoftTimeLimitExceeded raised at 4 min
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=10,
    result_backend=AppConfig.REDIS_URL,
    result_expires=3600,            # results kept for 1 hour
    broker_pool_limit=10,
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    # acks_late is set per-task on notification tasks, not globally,
    # so non-notification tasks are unaffected.
)

import sys
from pathlib import Path
from celery import Celery
from celery.schedules import crontab

from config import AppConfig

# Path setup 
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Celery instance 
celery_app = Celery(
    AppConfig.PROJECT_NAME,
    broker=AppConfig.REDIS_URL,  # uses CELERY_BROKER_URL via env override
    backend=AppConfig.REDIS_URL,
    include=[
        "src.domains.notifications.tasks",  # deliver_notification, review_manual_queue
    ],
)

# Queue routing 
# One queue per channel so worker pools are independent and channel failures
# don't block each other.
celery_app.conf.task_routes = {
    "src.domains.notifications.tasks.deliver_push":          {"queue": "push"},
    "src.domains.notifications.tasks.deliver_sms":           {"queue": "sms"},
    "src.domains.notifications.tasks.deliver_email":         {"queue": "email"},
    "src.domains.notifications.tasks.review_manual_queue":   {"queue": "celery"},  # default queue
}

# Beat schedule 
celery_app.conf.beat_schedule = {
    # Surfaces manual_review notifications to ops every 15 minutes
    "dlq-review-every-15min": {
        "task": "src.domains.notifications.tasks.review_manual_queue",
        "schedule": crontab(minute="*/15"),
    },
    # Contribution reminders — checks for contributions due in 24hrs, every hour
    "contribution-reminders-every-hour": {
        "task": "src.domains.notifications.tasks.send_contribution_reminders",
        "schedule": crontab(minute=0, hour="*"),
    },
}

# General config 
celery_app.conf.update(
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,            # hard kill after 5 min
    task_soft_time_limit=240,       # SoftTimeLimitExceeded raised at 4 min
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=10,
    result_backend=AppConfig.REDIS_URL,
    result_expires=3600,            # results kept for 1 hour
    broker_pool_limit=10,
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    # acks_late is set per-task on notification tasks, not globally,
    # so non-notification tasks are unaffected.
)

celery_app.autodiscover_tasks(["src.domains"], force=True)