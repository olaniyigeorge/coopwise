from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.models.cooperative import CoopCooperative


class CooperativeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, cooperative: CoopCooperative) -> CoopCooperative:
        self._session.add(cooperative)
        await self._session.flush()
        return cooperative

    async def get_by_id(self, cooperative_id: UUID | str) -> CoopCooperative | None:
        coop_id = str(cooperative_id)
        result = await self._session.execute(
            select(CoopCooperative).where(CoopCooperative.id == coop_id)
        )
        return result.scalar_one_or_none()

    async def list(self, *, limit: int = 50) -> Sequence[CoopCooperative]:
        result = await self._session.execute(
            select(CoopCooperative).order_by(CoopCooperative.created_at.desc()).limit(limit)
        )
        return result.scalars().all()
