from __future__ import annotations

from typing import Any
from uuid import UUID

from src.domains.cooperatives.events import EventDispatcher, NoOpEventDispatcher, RuleVersionCreated
from src.domains.cooperatives.models.rules import (
    CoopDecisionRule,
    CoopFinancialRule,
    CoopGovernanceRule,
    CoopMembershipRule,
)
from src.domains.cooperatives.uow import CooperativeUnitOfWork


class GovernanceRuleService:
    def __init__(self, uow: CooperativeUnitOfWork, events: EventDispatcher | None = None, logger: Any | None = None) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def create(self, rule: CoopGovernanceRule) -> CoopGovernanceRule:
        await self._uow.rules.add(rule)
        await self._uow.commit()
        await self._events.dispatch(RuleVersionCreated(cooperative_id=rule.cooperative_id, rule_type="governance", version=rule.version))
        return rule

    async def get_active(self, cooperative_id: UUID | str) -> CoopGovernanceRule | None:
        return await self._uow.rules.get_active_for_cooperative(CoopGovernanceRule, cooperative_id)


class MembershipRuleService:
    def __init__(self, uow: CooperativeUnitOfWork, events: EventDispatcher | None = None, logger: Any | None = None) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def create(self, rule: CoopMembershipRule) -> CoopMembershipRule:
        await self._uow.rules.add(rule)
        await self._uow.commit()
        await self._events.dispatch(RuleVersionCreated(cooperative_id=rule.cooperative_id, rule_type="membership", version=rule.version))
        return rule

    async def get_active(self, cooperative_id: UUID | str) -> CoopMembershipRule | None:
        return await self._uow.rules.get_active_for_cooperative(CoopMembershipRule, cooperative_id)


class FinancialRuleService:
    def __init__(self, uow: CooperativeUnitOfWork, events: EventDispatcher | None = None, logger: Any | None = None) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def create(self, rule: CoopFinancialRule) -> CoopFinancialRule:
        await self._uow.rules.add(rule)
        await self._uow.commit()
        await self._events.dispatch(RuleVersionCreated(cooperative_id=rule.cooperative_id, rule_type="financial", version=rule.version))
        return rule

    async def get_active(self, cooperative_id: UUID | str) -> CoopFinancialRule | None:
        return await self._uow.rules.get_active_for_cooperative(CoopFinancialRule, cooperative_id)


class DecisionRuleService:
    def __init__(self, uow: CooperativeUnitOfWork, events: EventDispatcher | None = None, logger: Any | None = None) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def create(self, rule: CoopDecisionRule) -> CoopDecisionRule:
        await self._uow.rules.add(rule)
        await self._uow.commit()
        await self._events.dispatch(RuleVersionCreated(cooperative_id=rule.cooperative_id, rule_type="decision", version=rule.version))
        return rule

    async def get_active(self, cooperative_id: UUID | str) -> CoopDecisionRule | None:
        return await self._uow.rules.get_active_for_cooperative(CoopDecisionRule, cooperative_id)
