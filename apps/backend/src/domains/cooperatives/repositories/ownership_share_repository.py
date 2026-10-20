from __future__ import annotations

from typing import Sequence
from uuid import UUID

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.cooperatives.models.goals import CoopOwnershipShare


class OwnershipShareRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, share: CoopOwnershipShare) -> CoopOwnershipShare:
        self._session.add(share)
        await self._session.flush()
        return share

    async def get_by_id(self, share_id: UUID | str) -> CoopOwnershipShare | None:
        result = await self._session.execute(
            select(CoopOwnershipShare).where(CoopOwnershipShare.id == share_id)
        )
        return result.scalars().first()

    async def delete(self, share: CoopOwnershipShare) -> None:
        await self._session.delete(share)
        await self._session.flush()

    async def list_for_goal(self, goal_id: UUID | str) -> Sequence[CoopOwnershipShare]:
        goal_id = str(goal_id)
        result = await self._session.execute(
            select(CoopOwnershipShare).where(CoopOwnershipShare.goal_id == goal_id)
        )
        return result.scalars().all()

    async def sum_share_pct_for_goal(self, goal_id: UUID | str) -> Decimal:
        goal_id = str(goal_id)
        result = await self._session.execute(
            select(func.coalesce(func.sum(CoopOwnershipShare.share_pct), 0)).where(
                CoopOwnershipShare.goal_id == goal_id
            )
        )
        return result.scalar_one()
