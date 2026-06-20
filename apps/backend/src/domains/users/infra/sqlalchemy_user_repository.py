from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.users.models import User


class SqlAlchemyUserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        return await self._db.get(User, user_id)

    async def list(self, skip: int, limit: int) -> List[User]:
        result = await self._db.execute(select(User).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def update(self, user: User) -> User:
        self._db.add(user)
        await self._db.commit()
        await self._db.refresh(user)
        return user
