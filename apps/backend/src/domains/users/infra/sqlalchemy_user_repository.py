from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.users.models import User
from sqlalchemy.exc import IntegrityError

_CONSTRAINT_FIELD_MESSAGES = {
    "ix_users_username": "Username is already in use",
    "ix_users_email": "Email is already in use",
    "ix_users_phone_number": "Phone number is already in use",
}


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
    
    def _conflict_message(self, e: IntegrityError) -> str:
        constraint_name = getattr(e.orig, "constraint_name", None)
        if constraint_name in _CONSTRAINT_FIELD_MESSAGES:
            return _CONSTRAINT_FIELD_MESSAGES[constraint_name]
        return "A user with one of these values already exists"
