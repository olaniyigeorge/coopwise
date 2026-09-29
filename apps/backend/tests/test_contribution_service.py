from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from src.domains.auth.schemas import AuthenticatedUser
from src.domains.contributions.models import Contribution, ContributionStatus
from src.domains.contributions.schemas import ContributionCreate
from src.domains.contributions.service import ContributionService
from src.domains.cooperatives.models.cooperative import CoopCooperative
from src.domains.cooperatives.models.enums import (
    ContributionFrequency,
    CooperativeStatus,
)
from src.domains.cooperatives.models.rules import CoopFinancialRule
from src.domains.memberships.models.enums import MembershipRole, MembershipStatus
from src.domains.memberships.models.group_membership import GroupMembership
from src.domains.users.models import User, UserRoles
from src.domains.wallets.schemas import WalletDeposit
from src.domains.wallets.service import WalletService

SUCCESS_RESULT = {"success": True, "tx_hash": "0xdeadbeef"}
FAILURE_RESULT = {"success": False, "error": "contract reverted"}


async def _make_user(db_session) -> AuthenticatedUser:
    user = User(
        id=uuid4(),
        username=f"user_{uuid4().hex[:8]}",
        email=f"{uuid4().hex[:8]}@coopwise.example",
        full_name="Test Contributor",
    )
    db_session.add(user)
    await db_session.flush()
    return AuthenticatedUser(id=user.id, email=user.email, role=UserRoles.user)


async def _make_cooperative(
    db_session, *, status=CooperativeStatus.ACTIVE
) -> CoopCooperative:
    creator = User(
        id=uuid4(),
        username=f"creator_{uuid4().hex[:8]}",
        email=f"{uuid4().hex[:8]}@coopwise.example",
        full_name="Creator",
    )
    db_session.add(creator)
    await db_session.flush()

    coop = CoopCooperative(name="Test Coop", status=status, created_by=creator.id)
    db_session.add(coop)
    await db_session.flush()
    return coop


async def _make_membership(
    db_session, user_id, group_id, *, active=True
) -> GroupMembership:
    membership = GroupMembership(
        user_id=user_id,
        group_id=group_id,
        role=MembershipRole.member,
        status=MembershipStatus.ACTIVE if active else MembershipStatus.LEFT,
    )
    db_session.add(membership)
    await db_session.flush()
    return membership


async def _make_financial_rule(
    db_session,
    cooperative_id,
    *,
    amount=Decimal("1000"),
    frequency=ContributionFrequency.DAILY,
) -> CoopFinancialRule:
    rule = CoopFinancialRule(
        cooperative_id=cooperative_id,
        contribution_frequency=frequency,
        contribution_amount=amount,
        currency="NGN",
    )
    db_session.add(rule)
    await db_session.flush()
    return rule


async def _fund_wallet(db_session, user: AuthenticatedUser, local_amount: Decimal):
    await WalletService.deposit(
        WalletDeposit(
            payment_gateway="mock_success", local_amount=local_amount, currency="NGN"
        ),
        db_session,
        user,
        None,
    )


# --------------------------------------------------------------------------
# process_manual_contribution
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_manual_contribution_rejects_non_member(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)

    with pytest.raises(HTTPException) as exc_info:
        await ContributionService.process_manual_contribution(
            ContributionCreate(user_id=user.id, group_id=coop.id, amount=100),
            user,
            db_session,
        )
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_manual_contribution_rejects_inactive_group(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session, status=CooperativeStatus.PENDING)
    await _make_membership(db_session, user.id, coop.id)

    with pytest.raises(HTTPException) as exc_info:
        await ContributionService.process_manual_contribution(
            ContributionCreate(user_id=user.id, group_id=coop.id, amount=100),
            user,
            db_session,
        )
    assert exc_info.value.status_code == 400
    assert "not active" in exc_info.value.detail


@pytest.mark.asyncio
async def test_manual_contribution_rejects_non_positive_amount(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_membership(db_session, user.id, coop.id)

    with pytest.raises(HTTPException) as exc_info:
        await ContributionService.process_manual_contribution(
            ContributionCreate(user_id=user.id, group_id=coop.id, amount=0),
            user,
            db_session,
        )
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_manual_contribution_rejects_insufficient_balance(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_membership(db_session, user.id, coop.id)

    with pytest.raises(HTTPException) as exc_info:
        await ContributionService.process_manual_contribution(
            ContributionCreate(user_id=user.id, group_id=coop.id, amount=100),
            user,
            db_session,
        )
    assert exc_info.value.status_code == 400
    assert "Insufficient" in exc_info.value.detail


@pytest.mark.asyncio
async def test_manual_contribution_happy_path_completes_and_finalizes_wallet(
    db_session,
):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_membership(db_session, user.id, coop.id)
    # 5% fee buffer means we need >105 for a 100 contribution.
    await _fund_wallet(db_session, user, Decimal("176000"))  # 110 stable units

    # NGN 160,000 == 100 stable units at 1 stable per NGN 1,600.
    contribution = await ContributionService.process_manual_contribution(
        ContributionCreate(user_id=user.id, group_id=coop.id, amount=160000),
        user,
        db_session,
    )

    assert contribution.status == ContributionStatus.completed

    balance = await WalletService.get_effective_balance(user.id, db_session)
    # 110 deposited, 100 locked+finalized (permanently gone to the pool).
    assert balance == Decimal("10.00000000")
    wallet = await WalletService.get_wallet(db_session, user, None)
    assert wallet.stable_coin_balance == Decimal("10")


@pytest.mark.asyncio
async def test_manual_contribution_failure_releases_funds_and_raises(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_membership(db_session, user.id, coop.id)
    await _fund_wallet(db_session, user, Decimal("176000"))  # 110 stable units

    # Anything blowing up after the funds were locked must hand them back
    # AND fail the request (it used to return None as if it had succeeded).
    with patch.object(
        ContributionService,
        "mark_contribution_success",
        side_effect=RuntimeError("settlement failed"),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await ContributionService.process_manual_contribution(
                ContributionCreate(user_id=user.id, group_id=coop.id, amount=160000),
                user,
                db_session,
            )
    assert exc_info.value.status_code == 500

    # Funds must have been released back, not stuck in locked.
    balance = await WalletService.get_effective_balance(user.id, db_session)
    assert balance == Decimal("110.00000000")


# --------------------------------------------------------------------------
# process_auto_contribution
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_auto_contribution_skips_inactive_member(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_membership(db_session, user.id, coop.id, active=False)

    result = await ContributionService.process_auto_contribution(
        coop.id, user, db_session
    )
    assert result is None


@pytest.mark.asyncio
async def test_auto_contribution_skips_when_no_financial_rule_configured(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_membership(db_session, user.id, coop.id)

    result = await ContributionService.process_auto_contribution(
        coop.id, user, db_session
    )
    assert result is None


@pytest.mark.asyncio
async def test_auto_contribution_skips_when_insufficient_balance(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_membership(db_session, user.id, coop.id)
    await _make_financial_rule(db_session, coop.id, amount=Decimal("1000"))

    result = await ContributionService.process_auto_contribution(
        coop.id, user, db_session
    )
    assert result is None


@pytest.mark.asyncio
async def test_auto_contribution_happy_path(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_membership(db_session, user.id, coop.id)
    await _make_financial_rule(
        db_session, coop.id, amount=Decimal("1"), frequency=ContributionFrequency.DAILY
    )
    await _fund_wallet(db_session, user, Decimal("1600"))  # 1 stable unit

    contribution = await ContributionService.process_auto_contribution(
        coop.id, user, db_session
    )

    assert contribution is not None
    assert contribution.status == ContributionStatus.completed
    assert contribution.amount == Decimal("1")


@pytest.mark.asyncio
async def test_auto_contribution_not_due_yet_returns_none(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_membership(db_session, user.id, coop.id)
    await _make_financial_rule(
        db_session,
        coop.id,
        amount=Decimal("1"),
        frequency=ContributionFrequency.MONTHLY,
    )
    await _fund_wallet(db_session, user, Decimal("1600"))

    # A completed contribution "just now" means a monthly cadence isn't due yet.
    db_session.add(
        Contribution(
            user_id=user.id,
            group_id=coop.id,
            amount=Decimal("1"),
            status=ContributionStatus.completed,
            fulfilled_at=datetime.now(),
        )
    )
    await db_session.flush()

    result = await ContributionService.process_auto_contribution(
        coop.id, user, db_session
    )
    assert result is None


# --------------------------------------------------------------------------
# _is_contribution_due (pure logic, no contract calls)
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_is_contribution_due_true_when_never_contributed(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_financial_rule(
        db_session, coop.id, frequency=ContributionFrequency.DAILY
    )

    assert (
        await ContributionService._is_contribution_due(db_session, coop.id, user.id)
        is True
    )


@pytest.mark.asyncio
async def test_is_contribution_due_false_within_daily_window(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_financial_rule(
        db_session, coop.id, frequency=ContributionFrequency.DAILY
    )
    db_session.add(
        Contribution(
            user_id=user.id,
            group_id=coop.id,
            amount=Decimal("1"),
            status=ContributionStatus.completed,
            created_at=datetime.now(),
        )
    )
    await db_session.flush()

    assert (
        await ContributionService._is_contribution_due(db_session, coop.id, user.id)
        is False
    )


@pytest.mark.asyncio
async def test_is_contribution_due_true_after_window_elapses(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    await _make_financial_rule(
        db_session, coop.id, frequency=ContributionFrequency.DAILY
    )
    db_session.add(
        Contribution(
            user_id=user.id,
            group_id=coop.id,
            amount=Decimal("1"),
            status=ContributionStatus.completed,
            created_at=datetime.now() - timedelta(days=2),
        )
    )
    await db_session.flush()

    assert (
        await ContributionService._is_contribution_due(db_session, coop.id, user.id)
        is True
    )


# --------------------------------------------------------------------------
# status mutation + read helpers
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_contribution_by_id_missing_raises_404(db_session):
    with pytest.raises(HTTPException) as exc_info:
        await ContributionService.get_contribution_by_id(db_session, uuid4())
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_mark_contribution_failed_sets_status_and_reason(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    contribution = Contribution(
        user_id=user.id,
        group_id=coop.id,
        amount=Decimal("10"),
        status=ContributionStatus.initiated,
    )
    db_session.add(contribution)
    await db_session.flush()
    await db_session.commit()

    await ContributionService.mark_contribution_failed(
        db=db_session, contribution_id=contribution.id, reason="test failure"
    )

    await db_session.refresh(contribution)
    assert contribution.status == ContributionStatus.failed
    assert "test failure" in contribution.note


@pytest.mark.asyncio
async def test_get_user_group_contributions_summary(db_session):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    db_session.add_all(
        [
            Contribution(
                user_id=user.id,
                group_id=coop.id,
                amount=Decimal("100"),
                status=ContributionStatus.completed,
            ),
            Contribution(
                user_id=user.id,
                group_id=coop.id,
                amount=Decimal("50"),
                status=ContributionStatus.initiated,
            ),
            Contribution(
                user_id=user.id,
                group_id=coop.id,
                amount=Decimal("25"),
                status=ContributionStatus.failed,
            ),
        ]
    )
    await db_session.flush()
    await db_session.commit()

    summary = await ContributionService.get_user_group_contributions(
        db_session, user.id, coop.id
    )

    assert summary["total_contributed"] == 100.0
    assert summary["total_pending"] == 50.0
    assert summary["contribution_count"] == 1
    assert summary["pending_count"] == 1
    assert summary["failed_count"] == 1
