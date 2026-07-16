import asyncio
import base64
import os

from sqlalchemy import update
from sqlalchemy.exc import SQLAlchemyError

from src.infra.storage.cloudinary_storage import CloudinaryStorage
from src.infra.db.database import db_manager
from src.infra.db.all_models import _users_models
from src.infra.celery.app import celery_app


@celery_app.task(name="users.upload_avatar", bind=True, max_retries=3, default_retry_delay=10)
def upload_avatar_task(self, user_id: str, file_data: str, filename: str, content_type: str):
    decoded = base64.b64decode(file_data)
    print("\n\n\n\n", os.environ.get("CLOUDINARY_URL"), "\n\n\n\n")
    storage = CloudinaryStorage()

    try:
        url = asyncio.run(
            storage.upload(key=f"avatars/{user_id}", content=decoded, content_type=content_type)
        )
    except Exception as exc:
        raise self.retry(exc=exc)

    try:
        asyncio.run(_persist_avatar_url(user_id=user_id, url=url))
    except Exception as exc:
        raise self.retry(exc=exc)

    return url


async def _persist_avatar_url(user_id: str, url: str) -> None:
    """Write the uploaded avatar URL back onto the user row.

    Runs inside the Celery worker process. db_manager is already
    initialized per-process by _bootstrap_worker_process, so this
    reuses the same engine/session machinery FastAPI uses.
    """
    async with db_manager.get_session() as session:
        try:
            await session.execute(
                update(_users_models.User)
                .where(_users_models.User.id == user_id)
                .values(profile_picture_url=url)
            )
            await session.commit()
        except SQLAlchemyError:
            await session.rollback()
            raise