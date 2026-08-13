from __future__ import annotations

from typing import Any
from uuid import UUID

from src.domains.cooperatives.events import NoOpEventDispatcher
from src.domains.cooperatives.models.goals import CoopOwnershipShare
from src.domains.cooperatives.uow import CooperativeUnitOfWork


class OwnershipShareService:
    def __init__(
        self,
        uow: CooperativeUnitOfWork,
        events: Any | None = None,
        logger: Any | None = None,
    ) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def add(self, share: CoopOwnershipShare) -> CoopOwnershipShare:
        await self._uow.ownership_shares.add(share)
        await self._uow.commit()
        return share

    async def list_for_goal(self, goal_id: UUID | str):
        return await self._uow.ownership_shares.list_for_goal(goal_id)

    async def list_shares(self, goal_id: UUID | str):
        return await self.list_for_goal(goal_id)
