from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.infra.storage.cloudinary_storage import CloudinaryStorage
from src.domains.users.infra.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.domains.users.service import UserService
from src.infra.db.dependencies import get_async_db_session


def get_user_service(
    db: AsyncSession = Depends(get_async_db_session),
) -> UserService:
    return UserService(
        user_repo=SqlAlchemyUserRepository(db)
    )
