from __future__ import annotations

from typing import Generic, Sequence, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class RulesRepository(Generic[T]):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, instance: T) -> T:
        self._session.add(instance)
        await self._session.flush()
        return instance

    async def get_by_id(self, model_cls: type[T], rule_id: UUID | str) -> T | None:
        rule_id = str(rule_id)
        result = await self._session.execute(select(model_cls).where(model_cls.id == rule_id))
        return result.scalar_one_or_none()

    async def get_active_for_cooperative(self, model_cls: type[T], cooperative_id: UUID | str) -> T | None:
        cooperative_id = str(cooperative_id)
        result = await self._session.execute(
            select(model_cls).where(model_cls.cooperative_id == cooperative_id).order_by(model_cls.version.desc())
        )
        return result.scalar_one_or_none()

    async def list_versions(self, model_cls: type[T], cooperative_id: UUID | str) -> Sequence[T]:
        cooperative_id = str(cooperative_id)
        result = await self._session.execute(
            select(model_cls)
            .where(model_cls.cooperative_id == cooperative_id)
            .order_by(model_cls.version.desc())
        )
        return result.scalars().all()
