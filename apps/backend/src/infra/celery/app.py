import logging
import sys
from pathlib import Path

from celery.signals import worker_process_init
from celery import Celery
from celery.signals import (
    after_setup_logger,
    after_setup_task_logger,
    task_prerun,
    task_postrun,
    task_failure,
    task_retry,
)
from kombu import Queue

from src.shared.utils.logger import logger, stream_handler, file_handler
from config import AppConfig

# Path setup
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Celery instance
celery_app = Celery(
    AppConfig.PROJECT_NAME,
    broker=AppConfig.REDIS_URL,
    backend=AppConfig.REDIS_URL,
    include=[
        "src.domains.notifications.tasks",
        "src.domains.auth.infra.tasks",
        "src.domains.kyc.tasks",
        "src.domains.users.tasks",
    ],
)

# --- Queues ---------------------------------------------------------------
# A worker ONLY consumes queues it is explicitly told to via -Q (or that
# ship in task_queues + are passed on the CLI). task_routes below only
# *routes* tasks to a queue name — it does not make any worker listen to
# it. Previously push/sms/email were routed-to but never declared/consumed
# by the worker started in dev.sh, so those messages published fine and
# then sat in Redis forever. Declaring them here + passing
# `-Q celery,push,sms,email` on the worker CLI is what actually wires
# routing -> consumption together.
celery_app.conf.task_queues = (
    Queue("celery"),
    Queue("push"),
    Queue("sms"),
    Queue("email"),
)
celery_app.conf.task_default_queue = "celery"

celery_app.conf.task_routes = {
    "src.domains.notifications.tasks.deliver_push":        {"queue": "push"},
    "src.domains.notifications.tasks.deliver_sms":         {"queue": "sms"},
    "src.domains.notifications.tasks.deliver_email":       {"queue": "email"},
    "src.domains.notifications.tasks.review_manual_queue": {"queue": "celery"},
    "src.domains.users.tasks.object_storage_tasks.upload_avatar_task": {"queue": "media"},
    # "celery" queue, which the worker always consumes.
}


@worker_process_init.connect
def _bootstrap_worker_process(**kwargs) -> None:
    """Everything a Celery worker child needs that FastAPI's lifespan
    would otherwise provide for free. Add to this, don't scatter
    equivalent init logic across individual task files."""
    import sqlalchemy
    from config import AppConfig as config
    from src.infra.db.database import db_manager
    from src.infra.storage.cloudinary_storage import configure_cloudinary
    import src.infra.db.all_models  # noqa: F401

    engine_kwargs = {}
    if "sqlite" in config.DATABASE_URL:
        engine_kwargs.update({
            "connect_args": {"check_same_thread": False},
            "poolclass": sqlalchemy.StaticPool,
        })
    db_manager.initialize(
        config.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1),
        **engine_kwargs,
    )

    configure_cloudinary()
    logger.info("[worker_process_init] worker process bootstrap complete")

# --- General config ---------------------------------------------------------
celery_app.conf.update(
    broker_url=AppConfig.REDIS_URL,
    result_backend=AppConfig.REDIS_URL,
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    task_soft_time_limit=240,
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
        "retry_policy": {"timeout": 5.0},
    },
    broker_connection_timeout=3,
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=10,
    result_expires=3600,
    broker_pool_limit=10,
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    # Belt-and-braces: even with this off, Celery still runs its own
    # logger setup path, which is why we hook after_setup_logger /
    # after_setup_task_logger below instead of relying on this alone.
    worker_hijack_root_logger=False,
)


@task_prerun.connect
def _log_task_prerun(sender=None, task_id=None, task=None, args=None, kwargs=None, **kw):
    logger.info(f"[celery] START {task.name} id={task_id} args={args} kwargs={kwargs}")


@task_postrun.connect
def _log_task_postrun(sender=None, task_id=None, task=None, state=None, **kw):
    logger.info(f"[celery] DONE {task.name} id={task_id} state={state}")


@task_failure.connect
def _log_task_failure(sender=None, task_id=None, exception=None, traceback=None, **kw):
    logger.error(f"[celery] FAILED {sender.name} id={task_id} exc={exception!r}", exc_info=True)


@task_retry.connect
def _log_task_retry(sender=None, request=None, reason=None, **kw):
    logger.warning(f"[celery] RETRY {sender.name} id={request.id} reason={reason}")


def _attach_handlers(logger=None, logfile=None, **_kw):
    """Runs AFTER Celery finishes its own logger/task-logger setup (main
    process, before fork), so these handlers survive regardless of
    worker_hijack_root_logger or Celery-internal reconfiguration. This
    replaces the old worker_process_init-based reinit, which raced
    Celery's own setup and, in practice, lost."""
    target = logger if logger is not None else logging.getLogger()
    for h in (stream_handler, file_handler):
        if h not in target.handlers:
            target.addHandler(h)
    target.setLevel(logging.INFO)


after_setup_logger.connect(_attach_handlers)
after_setup_task_logger.connect(_attach_handlers)