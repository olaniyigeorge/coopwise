import logging
import sys
from pathlib import Path
import pkgutil
import importlib

from celery import Celery
from celery.signals import worker_process_init
from celery.schedules import crontab
from celery.signals import task_prerun, task_postrun, task_failure, task_retry
    
from src.shared.utils.logger import logger, stream_handler, file_handler
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
        "src.domains.auth.infra.tasks",
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
# celery_app.conf.beat_schedule = {
#     # Surfaces manual_review notifications to ops every 15 minutes
#     "dlq-review-every-15min": {
#         "task": "src.domains.notifications.tasks.review_manual_queue",
#         "schedule": crontab(minute="*/15"),
#     },
#     # Contribution reminders — checks for contributions due in 24hrs, every hour
#     "contribution-reminders-every-hour": {
#         "task": "src.domains.notifications.tasks.send_contribution_reminders",
#         "schedule": crontab(minute=0, hour="*"),
#     },
# }

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
    broker_transport_options={
        "socket_timeout": 3,
        "socket_connect_timeout": 3,
    },
    result_backend_transport_options={
        "socket_timeout": 3,
        "socket_connect_timeout": 3,
        "retry_policy": {
            "timeout": 5.0,
        },
    },
    broker_connection_timeout=3,
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


def _find_task_modules(package_name: str):
    package = importlib.import_module(package_name)
    for finder, name, ispkg in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
        if name.endswith(".tasks"):
            yield name

celery_app.conf.include = list(celery_app.conf.include) + list(_find_task_modules("src.domains"))

@task_prerun.connect
def _log_task_prerun(sender=None, task_id=None, task=None, args=None, **kw):
    logger.info(f"[celery] START {task.name} id={task_id} args={args}")

@task_postrun.connect
def _log_task_postrun(sender=None, task_id=None, task=None, state=None, **kw):
    logger.info(f"[celery] DONE {task.name} id={task_id} state={state}")

@task_failure.connect
def _log_task_failure(sender=None, task_id=None, exception=None, **kw):
    logger.error(f"[celery] FAILED {sender.name} id={task_id} exc={exception}")

@task_retry.connect
def _log_task_retry(sender=None, request=None, reason=None, **kw):
    logger.warning(f"[celery] RETRY {sender.name} id={request.id} reason={reason}")


@worker_process_init.connect
def _reinit_logging_in_child(**kwargs):
    # re-attach handlers inside the forked child — root logger config
    # done at import time in MainProcess does not reliably survive fork
    root = logging.getLogger()
    if not root.handlers:
        root.addHandler(stream_handler)
        root.addHandler(file_handler)
