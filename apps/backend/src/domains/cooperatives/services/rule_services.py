from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID
from sqlalchemy.exc import IntegrityError

from src.domains.cooperatives.exceptions import (
    RuleNotFoundError,
    RuleVersionConflictError,
)
from src.domains.cooperatives.events import (
    EventDispatcher,
    NoOpEventDispatcher,
    RuleVersionCreated,
)
from src.domains.cooperatives.models.rules import (
    CoopDecisionRule,
    CoopFinancialRule,
    CoopGovernanceRule,
    CoopMembershipRule,
)
from src.domains.cooperatives.uow import CooperativeUnitOfWork


class GovernanceRuleService:
    def __init__(
        self,
        uow: CooperativeUnitOfWork,
        events: EventDispatcher | None = None,
        logger: Any | None = None,
    ) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def create(
        self, rule: CoopGovernanceRule, *, acting_user_id: UUID | str
    ) -> CoopGovernanceRule:
        current = await self._uow.rules.get_current_rule(
            rule.cooperative_id, "governance"
        )
        if current is not None:
            current.effective_to = datetime.now(timezone.utc)
            rule.version = current.version + 1
        else:
            rule.version = 1

        await self._uow.rules.add(rule)
        try:
            await self._uow.commit()
        except IntegrityError as e:
            await self._uow.rollback()
            raise RuleVersionConflictError(
                str(rule.cooperative_id), "governance"
            ) from e

        await self._events.dispatch(...)
        return rule

    async def get_active(self, cooperative_id: UUID | str) -> CoopGovernanceRule:
        rule = await self._uow.rules.get_current_rule(cooperative_id, "governance")
        if rule is None:
            raise RuleNotFoundError(str(cooperative_id), "governance")
        return rule


class MembershipRuleService:
    def __init__(
        self,
        uow: CooperativeUnitOfWork,
        events: EventDispatcher | None = None,
        logger: Any | None = None,
    ) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def create(
        self, rule: CoopMembershipRule, *, acting_user_id: UUID | str
    ) -> CoopMembershipRule:
        current = await self._uow.rules.get_current_rule(
            rule.cooperative_id, "membership"
        )

        if current is not None:
            current.effective_to = datetime.now(timezone.utc)
            rule.version = current.version + 1
        else:
            rule.version = 1

        await self._uow.rules.add(rule)
        try:
            await self._uow.commit()
        except IntegrityError as e:
            await self._uow.rollback()
            raise RuleVersionConflictError(
                str(rule.cooperative_id), "membership"
            ) from e

        await self._events.dispatch(
            RuleVersionCreated(
                cooperative_id=rule.cooperative_id,
                actor_id=UUID(str(acting_user_id)),
                rule_type="membership",
                version=rule.version,
            )
        )
        return rule

    async def get_active(self, cooperative_id: UUID | str) -> CoopMembershipRule:
        rule = await self._uow.rules.get_current_rule(cooperative_id, "membership")
        if rule is None:
            raise RuleNotFoundError(str(cooperative_id), "membership")
        return rule


class FinancialRuleService:
    def __init__(
        self,
        uow: CooperativeUnitOfWork,
        events: EventDispatcher | None = None,
        logger: Any | None = None,
    ) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def create(
        self, rule: CoopFinancialRule, *, acting_user_id: UUID | str
    ) -> CoopFinancialRule:
        current = await self._uow.rules.get_current_rule(
            rule.cooperative_id, "financial"
        )

        if current is not None:
            current.effective_to = datetime.now(timezone.utc)
            rule.version = current.version + 1
        else:
            rule.version = 1

        await self._uow.rules.add(rule)
        try:
            await self._uow.commit()
        except IntegrityError as e:
            await self._uow.rollback()
            raise RuleVersionConflictError(str(rule.cooperative_id), "financial") from e

        await self._events.dispatch(
            RuleVersionCreated(
                cooperative_id=rule.cooperative_id,
                actor_id=UUID(str(acting_user_id)),
                rule_type="financial",
                version=rule.version,
            )
        )
        return rule

    async def get_active(self, cooperative_id: UUID | str) -> CoopFinancialRule:
        rule = await self._uow.rules.get_current_rule(cooperative_id, "financial")
        if rule is None:
            raise RuleNotFoundError(str(cooperative_id), "financial")
        return rule


class DecisionRuleService:
    def __init__(
        self,
        uow: CooperativeUnitOfWork,
        events: EventDispatcher | None = None,
        logger: Any | None = None,
    ) -> None:
        self._uow = uow
        self._events = events or NoOpEventDispatcher()
        self._logger = logger

    async def create(
        self, rule: CoopDecisionRule, *, acting_user_id: UUID | str
    ) -> CoopDecisionRule:
        current = await self._uow.rules.get_current_rule(
            rule.cooperative_id, "decision"
        )

        if current is not None:
            current.effective_to = datetime.now(timezone.utc)
            rule.version = current.version + 1
        else:
            rule.version = 1

        await self._uow.rules.add(rule)
        try:
            await self._uow.commit()
        except IntegrityError as e:
            await self._uow.rollback()
            raise RuleVersionConflictError(str(rule.cooperative_id), "decision") from e

        await self._events.dispatch(
            RuleVersionCreated(
                cooperative_id=rule.cooperative_id,
                actor_id=UUID(str(acting_user_id)),
                rule_type="decision",
                version=rule.version,
            )
        )
        return rule

    async def get_active(self, cooperative_id: UUID | str) -> CoopDecisionRule:
        rule = await self._uow.rules.get_current_rule(cooperative_id, "decision")
        if rule is None:
            raise RuleNotFoundError(str(cooperative_id), "decision")
        return rule
