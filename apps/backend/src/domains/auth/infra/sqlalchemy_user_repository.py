"""
SQLAlchemy adapter for the UserRepository port.

This is the ONLY file in the auth domain allowed to import sqlalchemy.

CHANGED vs the Crossmint-Auth version: get_by_crossmint_user_id replaced
with get_by_firebase_uid; get_by_phone_number added back as a first-class
lookup since phone is now an equally-primary identifier, not a secondary
field.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.users.models import User


class SqlAlchemyUserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        return await self._db.get(User, user_id)

    async def get_by_phone_number(self, phone_number: str) -> Optional[User]:
        result = await self._db.execute(
            select(User).where(User.phone_number == phone_number)
        )
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self._db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        result = await self._db.execute(
            select(User).where(User.firebase_uid == firebase_uid)
        )
        return result.scalars().first()

    async def add(self, user: User) -> User:
        self._db.add(user)
        await self._db.commit()
        await self._db.refresh(user)
        return user

    async def update(self, user: User) -> User:
        self._db.add(user)
        await self._db.commit()
        await self._db.refresh(user)
        return user