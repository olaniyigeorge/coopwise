import asyncio
import sys
from pathlib import Path
from celery import Celery
from celery.schedules import crontab

from config import AppConfig
from db.database import db_manager

# ----------------------
# Ensure project root is discoverable
# ---------------------
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

print(f"\n\n=== Celery Configuration ===")
print(f"Redis URL: {AppConfig.REDIS_URL}")
print(f"Project Root: {project_root}\n\n")

# ------------------
# Create Celery instance
# -----------------
celery_app = Celery(
    AppConfig.PROJECT_NAME,
    broker=AppConfig.REDIS_URL,
    backend=AppConfig.REDIS_URL,  # Enables result tracking in Redis
    include=["app.pipelines"],  # Ensure your event tasks are loaded
)

# --------------------------------
# Beat Schedule (Periodic Tasks)
# --------------------------------
celery_app.conf.beat_schedule = {
    # "check-event-reminders-every-hour": {
    #     "task": "app.events.tasks.send_event_reminder_to_regs",
    #     "schedule": crontab(minute=0, hour="*"),  # every hour on the hour
    #     "args": ["email"],
    # },
    # Uncomment this line temporarily if you want to confirm Beat runs
    # "test-task-every-30s": {
    #     "task": "app.events.tasks.test_task",
    #     "schedule": 30.0,  # every 30 seconds
    #     "args": ["hello from Beat!"],
    # },

}

# -------------------------------
# General Celery configuration
# -------------------------------
celery_app.conf.update(
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,        
    task_soft_time_limit=240,   
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=10,
    result_backend=AppConfig.REDIS_URL,
    result_expires=3600,        # 1 hour
    broker_pool_limit=10,
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)

# ----------------------------------
# Auto-discover tasks from modules
# ----------------------------------
celery_app.autodiscover_tasks(["app.pipelines"], force=True)

# ------------------------------------------------
# Optional: Post-configure signal for future hooks
# -------------------------------------------------
# @celery_app.on_after_configure.connect
# def init_db(sender, **kwargs):
#     """Optional: Initialize DB connection when Celery starts."""
#     print("🔌 Initializing DB for Celery worker...")
#     try:
#         db_manager.initialize(AppConfig.DATABASE_URL)
#         print("\nDB Initialized successfully")
#     except Exception as e:
#         print(f"\n Failed to initialize DB: {e}")
