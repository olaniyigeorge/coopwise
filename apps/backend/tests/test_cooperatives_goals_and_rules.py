from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import select

from src.domains.cooperatives.exceptions import (
    IncompleteGoalContractError,
    InvalidContractFieldsError,
    OwnershipShareOverallocatedError,
    RuleNotFoundError,
)
from src.domains.cooperatives.models.cooperative import CoopCooperative
from src.domains.cooperatives.models.enums import (
    DecisionModel,
    ExitRuleType,
    OwnershipBasis,
    ValuationMethod,
)
from src.domains.cooperatives.models.goals import (
    CoopBeneficiaryPattern,
    CoopGoal,
    CoopGoalCategory,
    CoopOwnershipShare,
)
from src.domains.cooperatives.models.rules import CoopDecisionRule, CoopGovernanceRule
from src.domains.cooperatives.schemas import GoalContractCreate
from src.domains.cooperatives.services.goal_service import GoalService
from src.domains.cooperatives.services.ownership_share_service import (
    OwnershipShareService,
)
from src.domains.cooperatives.services.rule_services import (
    DecisionRuleService,
    GovernanceRuleService,
)
from src.domains.cooperatives.uow import UnitOfWork
from src.domains.users.models import User


async def _make_cooperative(db_session) -> CoopCooperative:
    creator = User(
        id=uuid4(),
        username=f"user_{uuid4().hex[:8]}",
        email=f"{uuid4().hex[:8]}@coopwise.example",
        full_name="Test Creator",
    )
    db_session.add(creator)
    await db_session.flush()

    coop = CoopCooperative(name="Test Coop", created_by=creator.id)
    db_session.add(coop)
    await db_session.flush()
    return coop


async def _get_pattern(db_session, code: str) -> CoopBeneficiaryPattern:
    result = await db_session.execute(
        select(CoopBeneficiaryPattern).where(CoopBeneficiaryPattern.code == code)
    )
    return result.scalar_one()


async def _get_category(db_session) -> CoopGoalCategory:
    result = await db_session.execute(select(CoopGoalCategory).limit(1))
    return result.scalars().first()


async def _make_goal(db_session, coop, pattern_code: str) -> CoopGoal:
    pattern = await _get_pattern(db_session, pattern_code)
    category = await _get_category(db_session)
    goal = CoopGoal(
        cooperative_id=coop.id,
        beneficiary_pattern_id=pattern.id,
        goal_category_id=category.id,
        name="Test Goal",
        currency="NGN",
        created_by=coop.created_by,
    )
    db_session.add(goal)
    await db_session.flush()
    return goal


# --------------------------------------------------------------------------
# GoalService.create_goal_contract — per beneficiary pattern
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_rotating_tracked_contract_missing_required_fields_raises(db_session):
    coop = await _make_cooperative(db_session)
    goal = await _make_goal(db_session, coop, "rotating_tracked")
    service = GoalService(UnitOfWork(db_session))

    with pytest.raises(IncompleteGoalContractError) as exc_info:
        await service.create_goal_contract(
            goal.id, GoalContractCreate(visibility="private"), acting_user_id=uuid4()
        )
    assert "withdrawal_restriction" in exc_info.value.missing
    assert "deadline" in exc_info.value.missing


@pytest.mark.asyncio
async def test_rotating_tracked_contract_all_required_fields_succeeds(db_session):
    coop = await _make_cooperative(db_session)
    goal = await _make_goal(db_session, coop, "rotating_tracked")
    service = GoalService(UnitOfWork(db_session))

    contract = await service.create_goal_contract(
        goal.id,
        GoalContractCreate(
            visibility="private",
            withdrawal_restriction="locked_until_deadline",
            deadline=date(2027, 1, 1),
        ),
        acting_user_id=uuid4(),
    )
    assert contract.goal_id == goal.id


@pytest.mark.asyncio
async def test_pooled_for_shared_contract_rejects_disallowed_field(db_session):
    coop = await _make_cooperative(db_session)
    goal = await _make_goal(db_session, coop, "pooled_for_shared")
    service = GoalService(UnitOfWork(db_session))

    with pytest.raises(InvalidContractFieldsError) as exc_info:
        await service.create_goal_contract(
            goal.id,
            GoalContractCreate(
                exit_rule_type=ExitRuleType.BUYOUT,
                valuation_method=ValuationMethod.NEGOTIATED,
                # beneficiary_user_id is a pooled_for_one field, not allowed here.
                beneficiary_user_id=uuid4(),
            ),
            acting_user_id=uuid4(),
        )
    assert "beneficiary_user_id" in exc_info.value.invalid_fields


@pytest.mark.asyncio
async def test_pooled_contingent_contract_all_required_fields_succeeds(db_session):
    coop = await _make_cooperative(db_session)
    goal = await _make_goal(db_session, coop, "pooled_contingent")
    service = GoalService(UnitOfWork(db_session))

    contract = await service.create_goal_contract(
        goal.id,
        GoalContractCreate(
            claim_eligibility_criteria={"trigger_type": "manual", "conditions": []}
        ),
        acting_user_id=uuid4(),
    )
    assert contract.claim_eligibility_criteria == {
        "trigger_type": "manual",
        "conditions": [],
    }


# --------------------------------------------------------------------------
# OwnershipShareService.add — Decimal precision at the 100% boundary
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_ownership_shares_summing_to_exactly_100_does_not_raise(db_session):
    coop = await _make_cooperative(db_session)
    goal = await _make_goal(db_session, coop, "pooled_for_shared")
    service = OwnershipShareService(UnitOfWork(db_session))

    for pct in (Decimal("33.34"), Decimal("33.33"), Decimal("33.33")):
        user = User(
            id=uuid4(),
            username=f"user_{uuid4().hex[:8]}",
            email=f"{uuid4().hex[:8]}@coopwise.example",
            full_name="Shareholder",
        )
        db_session.add(user)
        await db_session.flush()
        await service.add(
            CoopOwnershipShare(
                goal_id=goal.id,
                user_id=user.id,
                share_pct=pct,
                basis=OwnershipBasis.CONTRIBUTION_BASED,
            )
        )
    # No exception means 33.34 + 33.33 + 33.33 == 100.00 exactly was accepted.


@pytest.mark.asyncio
async def test_ownership_shares_exceeding_100_raises(db_session):
    coop = await _make_cooperative(db_session)
    goal = await _make_goal(db_session, coop, "pooled_for_shared")
    service = OwnershipShareService(UnitOfWork(db_session))

    user1 = User(
        id=uuid4(), username=f"user_{uuid4().hex[:8]}",
        email=f"{uuid4().hex[:8]}@coopwise.example", full_name="A",
    )
    user2 = User(
        id=uuid4(), username=f"user_{uuid4().hex[:8]}",
        email=f"{uuid4().hex[:8]}@coopwise.example", full_name="B",
    )
    db_session.add_all([user1, user2])
    await db_session.flush()

    await service.add(
        CoopOwnershipShare(
            goal_id=goal.id, user_id=user1.id, share_pct=Decimal("60"),
            basis=OwnershipBasis.CONTRIBUTION_BASED,
        )
    )
    with pytest.raises(OwnershipShareOverallocatedError):
        await service.add(
            CoopOwnershipShare(
                goal_id=goal.id, user_id=user2.id, share_pct=Decimal("40.01"),
                basis=OwnershipBasis.CONTRIBUTION_BASED,
            )
        )


# --------------------------------------------------------------------------
# Rule versioning (GovernanceRuleService, representative of all four)
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_active_rule_raises_when_none_exists(db_session):
    coop = await _make_cooperative(db_session)
    service = GovernanceRuleService(UnitOfWork(db_session))

    with pytest.raises(RuleNotFoundError):
        await service.get_active(coop.id)


@pytest.mark.asyncio
async def test_creating_a_second_rule_versions_and_closes_the_first(db_session):
    coop = await _make_cooperative(db_session)
    service = GovernanceRuleService(UnitOfWork(db_session))

    first = await service.create(
        CoopGovernanceRule(
            cooperative_id=coop.id, decision_model=DecisionModel.ADMIN_LED
        ),
        acting_user_id=uuid4(),
    )
    assert first.version == 1
    assert first.effective_to is None

    second = await service.create(
        CoopGovernanceRule(
            cooperative_id=coop.id, decision_model=DecisionModel.MAJORITY_VOTE
        ),
        acting_user_id=uuid4(),
    )
    assert second.version == 2
    assert second.effective_to is None

    await db_session.refresh(first)
    assert first.effective_to is not None  # closed out, not still "current"

    active = await service.get_active(coop.id)
    assert active.id == second.id
    assert active.decision_model == DecisionModel.MAJORITY_VOTE


@pytest.mark.asyncio
async def test_decision_rules_of_different_types_coexist_independently(db_session):
    """decision rules are keyed by (cooperative_id, decision_type), unlike
    the other three rule types — creating one type must not close out or
    conflict with an already-active rule of a different type."""
    coop = await _make_cooperative(db_session)
    service = DecisionRuleService(UnitOfWork(db_session))

    payout_rule = await service.create(
        CoopDecisionRule(
            cooperative_id=coop.id,
            decision_type="payout_order",
            mechanism="admin",
        ),
        acting_user_id=uuid4(),
    )
    dispute_rule = await service.create(
        CoopDecisionRule(
            cooperative_id=coop.id,
            decision_type="dispute_resolution",
            mechanism="vote",
        ),
        acting_user_id=uuid4(),
    )

    assert payout_rule.version == 1
    assert dispute_rule.version == 1

    await db_session.refresh(payout_rule)
    assert payout_rule.effective_to is None  # not closed out by the second create

    active_payout = await service.get_active(coop.id, "payout_order")
    active_dispute = await service.get_active(coop.id, "dispute_resolution")
    assert active_payout.id == payout_rule.id
    assert active_dispute.id == dispute_rule.id

    with pytest.raises(RuleNotFoundError):
        await service.get_active(coop.id, "exit_valuation")
