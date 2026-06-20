"""
SQLAlchemy adapter for the UserRepository port.

This is the ONLY file in the auth domain allowed to import sqlalchemy.
Keeping all `select(User).where(...)` calls here means:
  - AuthService tests never touch a real engine/session.
  - If we ever swap ORMs, this is the one file that changes.
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

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self._db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_by_username(self, username: str) -> Optional[User]:
        result = await self._db.execute(select(User).where(User.username == username))
        return result.scalars().first()

    async def get_by_phone_number(self, phone_number: Optional[str]) -> Optional[User]:
        if phone_number is None:
            return None
        result = await self._db.execute(
            select(User).where(User.phone_number == phone_number)
        )
        return result.scalars().first()

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        return await self._db.get(User, user_id)

    async def get_by_crossmint_user_id(self, crossmint_user_id: str) -> Optional[User]:
        result = await self._db.execute(
            select(User).where(User.crossmint_user_id == crossmint_user_id)
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
