from __future__ import annotations

from typing import Any
from uuid import UUID

from src.domains.memberships.models.group_membership import GroupMembership
from src.shared.utils.logger import logger
from src.domains.cooperatives.events import CooperativeActivated, EventDispatcher, NoOpEventDispatcher
from src.domains.cooperatives.exceptions import CooperativeNotFoundError, IllegalStatusTransitionError, NotAuthorizedError
from src.domains.cooperatives.models.cooperative import CoopCooperative
from src.domains.cooperatives.models.enums import CooperativeModel, CooperativeStatus
from src.domains.cooperatives.uow import UnitOfWork


class CooperativeService:
    def __init__(self, uow: UnitOfWork, events: EventDispatcher | None = None, logger: Any | None = None) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()

    async def create(
        self,
        *,
        name: str,
        description: str | None = None,
        cover_image: str | None = None,
        coop_model: CooperativeModel = CooperativeModel.COOP,
        created_by: UUID | str,
    ) -> CoopCooperative:
        created_by_uuid = (
            created_by if isinstance(created_by, UUID) else UUID(str(created_by))
        )

        cooperative = CoopCooperative(
            name=name,
            description=description,
            cover_image=cover_image,
            status=CooperativeStatus.PENDING,
            coop_model=coop_model,
            created_by=created_by_uuid,
        )

        await self._uow.cooperatives.add(cooperative)
        await self._uow.commit()
        return cooperative


    async def get_for_user(
        self,
        user_id: UUID | str,
    ) -> list[CoopCooperative]:
        user_uuid = user_id if isinstance(user_id, UUID) else UUID(str(user_id))
        return await self._uow.cooperatives.get_for_user(user_uuid)

    async def get_members(
        self,
        cooperative_id: UUID | str,
    ) -> list[GroupMembership]:
        cooperative_uuid = (
            cooperative_id
            if isinstance(cooperative_id, UUID)
            else UUID(str(cooperative_id))
        )
        return await self._uow.cooperatives.get_members(cooperative_uuid)

    async def get_by_id(self, cooperative_id: UUID | str) -> CoopCooperative | None:
        return await self._uow.cooperatives.get_by_id(cooperative_id)

    async def list(self, *, limit: int = 50):
        return await self._uow.cooperatives.list(limit=limit)

    async def list_cooperatives(self, filters: dict[str, Any] | None = None, page: int = 1, page_size: int = 20):
        return await self._uow.cooperatives.list(limit=page_size)

    async def get_cooperative(self, cooperative_id: UUID | str) -> CoopCooperative:
        cooperative = await self._uow.cooperatives.get_by_id(cooperative_id)
        if cooperative is None:
            raise CooperativeNotFoundError(str(cooperative_id))
        return cooperative

    async def get_cooperative_detail(self, cooperative_id: UUID | str) -> dict[str, Any]:
        cooperative = await self.get_cooperative(cooperative_id)
        return {
            "cooperative": cooperative,
            "rules": {},
            "member_count": 0,
            "goal_count": 0,
        }

    async def update(self, cooperative_id: UUID | str, acting_user_id: UUID | str, **fields: Any) -> CoopCooperative:
        cooperative = await self.get_cooperative(cooperative_id)
        if acting_user_id is not None:
            # auth is intentionally lightweight at this scaffold stage
            pass
        for key, value in fields.items():
            if key in {"name", "description", "cover_image"}:
                setattr(cooperative, key, value)
        await self._uow.commit()
        return cooperative

    async def activate(self, cooperative_id: UUID | str, acting_user_id: UUID | str) -> CoopCooperative:
        cooperative = await self.get_cooperative(cooperative_id)
        if cooperative.status != CooperativeStatus.PENDING:
            raise IllegalStatusTransitionError(f"{cooperative.status}", f"{CooperativeStatus.ACTIVE}")
        if acting_user_id is None:
            raise NotAuthorizedError()

        cooperative.status = CooperativeStatus.ACTIVE
        await self._uow.commit()
        logger.info(f"cooperative.activated: cooperative_id={str(cooperative.id)}, actor_id={str(acting_user_id)}")
        await self._events.dispatch(CooperativeActivated(cooperative_id=cooperative.id, actor_id=UUID(str(acting_user_id))))        
        return cooperative
