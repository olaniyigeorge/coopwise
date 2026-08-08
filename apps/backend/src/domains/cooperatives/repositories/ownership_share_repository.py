from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.models.goals import CoopOwnershipShare


class OwnershipShareRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, share: CoopOwnershipShare) -> CoopOwnershipShare:
        self._session.add(share)
        await self._session.flush()
        return share

    async def list_for_goal(self, goal_id: UUID | str) -> Sequence[CoopOwnershipShare]:
        goal_id = str(goal_id)
        result = await self._session.execute(
            select(CoopOwnershipShare).where(CoopOwnershipShare.goal_id == goal_id)
        )
        return result.scalars().all()
