from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from src.domains.contributions.models import Contribution, ContributionStatus
from src.domains.cooperatives.models.cooperative import CoopCooperative
from src.domains.cooperatives.models.enums import CooperativeModel, CooperativeStatus
from src.domains.kyc.models import (
    KYCBankingInfo,
    KYCStatus,
    KYCStepStatus,
    KYCVerification,
)
from src.domains.memberships.models.enums import MembershipRole, MembershipStatus
from src.domains.memberships.models.group_membership import GroupMembership
from src.domains.payments.models import PayoutRecord, PayoutStatus
from src.domains.payments.service import PayoutError, PayoutService
from src.domains.users.models import User
from src.infra.security.field_encryptor import FieldEncryptor
from config import AppConfig as config


async def _make_user(db, full_name="Test User") -> User:
    user = User(
        id=uuid4(),
        username=f"user_{uuid4().hex[:8]}",
        email=f"{uuid4().hex[:8]}@coopwise.example",
        full_name=full_name,
    )
    db.add(user)
    await db.flush()
    return user


async def _give_verified_bank_account(db, user: User) -> None:
    kyc = KYCVerification(id=uuid4(), user_id=user.id, status=KYCStatus.verified)
    db.add(kyc)
    await db.flush()

    encryptor = FieldEncryptor(config.SECRET_ENCRYPTION_KEY)
    banking_info = KYCBankingInfo(
        id=uuid4(),
        kyc_verification_id=kyc.id,
        bank_name="Test Bank",
        bank_code="058",
        account_number_encrypted=encryptor.encrypt("0123456789"),
        account_number_last4="6789",
        account_name=user.full_name,
        provider_verified=True,
        status=KYCStepStatus.approved,
    )
    db.add(banking_info)
    await db.flush()


async def _make_group(db, creator: User) -> CoopCooperative:
    group = CoopCooperative(
        name="Test Coop",
        status=CooperativeStatus.ACTIVE,
        coop_model=CooperativeModel.COOP,
        created_by=creator.id,
    )
    db.add(group)
    await db.flush()
    return group


async def _join(db, group, user, joined_at) -> GroupMembership:
    membership = GroupMembership(
        user_id=user.id,
        group_id=group.id,
        role=MembershipRole.member,
        status=MembershipStatus.ACTIVE,
        joined_at=joined_at,
    )
    db.add(membership)
    await db.flush()
    return membership


async def _completed_contribution(db, group, user, amount) -> Contribution:
    contribution = Contribution(
        user_id=user.id,
        group_id=group.id,
        amount=Decimal(amount),
        status=ContributionStatus.completed,
        fulfilled_at=datetime.now(),
    )
    db.add(contribution)
    await db.flush()
    return contribution


@pytest.mark.asyncio
async def test_execute_payout_pays_earliest_joiner_first(db_session):
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)

    alice = await _make_user(db_session, "Alice")
    bob = await _make_user(db_session, "Bob")
    await _join(db_session, group, alice, datetime.now() - timedelta(days=2))
    await _join(db_session, group, bob, datetime.now() - timedelta(days=1))
    await _give_verified_bank_account(db_session, alice)
    await _give_verified_bank_account(db_session, bob)

    await _completed_contribution(db_session, group, alice, "5000")
    await _completed_contribution(db_session, group, bob, "5000")
    await db_session.commit()

    with patch(
        "src.domains.payments.service.PaymentService.create_paystack_transfer_recipient",
        return_value="RCP_test123",
    ), patch(
        "src.domains.payments.service.PaymentService.initiate_paystack_transfer",
        return_value={"reference": "will-be-overridden", "status": "pending"},
    ):
        payout = await PayoutService.execute_payout(db=db_session, group_id=group.id)

    assert payout.user_id == alice.id  # earliest joiner goes first
    assert payout.amount == Decimal("10000")
    assert payout.status == PayoutStatus.processing
    assert payout.recipient_code == "RCP_test123"


@pytest.mark.asyncio
async def test_execute_payout_requires_verified_bank_account(db_session):
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)

    alice = await _make_user(db_session, "Alice")
    bob = await _make_user(db_session, "Bob")
    await _join(db_session, group, alice, datetime.now())
    await _join(db_session, group, bob, datetime.now())
    # deliberately no KYC banking info for either member

    await _completed_contribution(db_session, group, alice, "5000")
    await db_session.commit()

    with pytest.raises(PayoutError, match="verified bank-account KYC"):
        await PayoutService.execute_payout(db=db_session, group_id=group.id)


@pytest.mark.asyncio
async def test_execute_payout_requires_funds(db_session):
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)

    alice = await _make_user(db_session, "Alice")
    bob = await _make_user(db_session, "Bob")
    await _join(db_session, group, alice, datetime.now())
    await _join(db_session, group, bob, datetime.now())
    await db_session.commit()

    with pytest.raises(PayoutError, match="No funds available"):
        await PayoutService.execute_payout(db=db_session, group_id=group.id)


@pytest.mark.asyncio
async def test_execute_payout_rejects_inactive_group(db_session):
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)
    group.status = CooperativeStatus.PAUSED
    await db_session.flush()

    with pytest.raises(PayoutError, match="not active"):
        await PayoutService.execute_payout(db=db_session, group_id=group.id)


@pytest.mark.asyncio
async def test_execute_payout_rejects_single_member_group(db_session):
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)
    alice = await _make_user(db_session, "Alice")
    await _join(db_session, group, alice, datetime.now())

    with pytest.raises(PayoutError, match="Minimum 2 active members"):
        await PayoutService.execute_payout(db=db_session, group_id=group.id)


@pytest.mark.asyncio
async def test_execute_payout_records_failure_instead_of_raising_on_paystack_error(
    db_session,
):
    """Paystack-side failures are a durable audit trail on the record, not
    an exception — the money-movement path this whole service exists for."""
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)
    alice = await _make_user(db_session, "Alice")
    bob = await _make_user(db_session, "Bob")
    await _join(db_session, group, alice, datetime.now() - timedelta(days=1))
    await _join(db_session, group, bob, datetime.now())
    await _give_verified_bank_account(db_session, alice)
    await _completed_contribution(db_session, group, alice, "5000")
    await db_session.commit()

    with patch(
        "src.domains.payments.service.PaymentService.create_paystack_transfer_recipient",
        side_effect=HTTPException(status_code=502, detail="Paystack unreachable"),
    ):
        payout = await PayoutService.execute_payout(db=db_session, group_id=group.id)

    assert payout.status == PayoutStatus.failed
    assert "Paystack unreachable" in payout.failure_reason
    # A PayoutRecord row exists either way — that's the audit trail.
    assert payout.id is not None


@pytest.mark.asyncio
async def test_get_current_round_with_no_members_defaults_to_one(db_session):
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)

    assert await PayoutService.get_current_round(db_session, group.id) == 1


@pytest.mark.asyncio
async def test_get_next_recipient_ties_broken_by_join_order(db_session):
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)
    alice = await _make_user(db_session, "Alice")
    bob = await _make_user(db_session, "Bob")
    await _join(db_session, group, alice, datetime.now() - timedelta(days=2))
    await _join(db_session, group, bob, datetime.now() - timedelta(days=1))

    # Neither has a completed payout — tie broken by earliest join (alice).
    recipient = await PayoutService.get_next_recipient(db_session, group.id)
    assert recipient.user_id == alice.id


@pytest.mark.asyncio
async def test_get_payable_amount_excludes_contributions_at_exact_boundary(db_session):
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)
    alice = await _make_user(db_session, "Alice")
    await _join(db_session, group, alice, datetime.now())

    boundary = datetime.now() - timedelta(hours=1)
    payout_record = PayoutRecord(
        group_id=group.id,
        user_id=alice.id,
        round_number=1,
        amount=Decimal("1000"),
        status=PayoutStatus.completed,
        completed_at=boundary,
    )
    db_session.add(payout_record)
    # Contribution fulfilled at exactly the last payout's completed_at —
    # strict `>` comparison in get_payable_amount should exclude it.
    db_session.add(
        Contribution(
            user_id=alice.id,
            group_id=group.id,
            amount=Decimal("500"),
            status=ContributionStatus.completed,
            fulfilled_at=boundary,
        )
    )
    # This one is after the boundary and should count.
    db_session.add(
        Contribution(
            user_id=alice.id,
            group_id=group.id,
            amount=Decimal("300"),
            status=ContributionStatus.completed,
            fulfilled_at=boundary + timedelta(minutes=1),
        )
    )
    await db_session.flush()

    amount = await PayoutService.get_payable_amount(db_session, group.id)
    assert amount == Decimal("300")


@pytest.mark.asyncio
async def test_check_payout_readiness_reports_not_ready_for_unknown_group(db_session):
    result = await PayoutService.check_payout_readiness(db_session, uuid4())
    assert result == {"is_ready": False, "error": "Group not found"}


@pytest.mark.asyncio
async def test_check_payout_readiness_happy_path(db_session):
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)
    alice = await _make_user(db_session, "Alice")
    await _join(db_session, group, alice, datetime.now())
    await _completed_contribution(db_session, group, alice, "1000")
    await db_session.flush()

    result = await PayoutService.check_payout_readiness(db_session, group.id)
    assert result["is_ready"] is True
    assert result["next_recipient_user_id"] == str(alice.id)
    assert result["payable_amount"] == 1000.0


@pytest.mark.asyncio
async def test_mark_payout_from_webhook_unknown_reference_returns_none(db_session):
    result = await PayoutService.mark_payout_from_webhook(
        db_session, reference="does-not-exist", success=True
    )
    assert result is None


@pytest.mark.asyncio
async def test_mark_payout_from_webhook_marks_completed(db_session):
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)
    alice = await _make_user(db_session, "Alice")
    payout_record = PayoutRecord(
        group_id=group.id,
        user_id=alice.id,
        round_number=1,
        amount=Decimal("1000"),
        status=PayoutStatus.processing,
        provider_reference="ref-abc-123",
    )
    db_session.add(payout_record)
    await db_session.flush()

    result = await PayoutService.mark_payout_from_webhook(
        db_session, reference="ref-abc-123", success=True
    )

    assert result.status == PayoutStatus.completed
    assert result.completed_at is not None


@pytest.mark.asyncio
async def test_mark_payout_from_webhook_marks_failed_with_reason(db_session):
    creator = await _make_user(db_session, "Creator")
    group = await _make_group(db_session, creator)
    alice = await _make_user(db_session, "Alice")
    payout_record = PayoutRecord(
        group_id=group.id,
        user_id=alice.id,
        round_number=1,
        amount=Decimal("1000"),
        status=PayoutStatus.processing,
        provider_reference="ref-xyz-789",
    )
    db_session.add(payout_record)
    await db_session.flush()

    result = await PayoutService.mark_payout_from_webhook(
        db_session,
        reference="ref-xyz-789",
        success=False,
        failure_reason="bank declined",
    )

    assert result.status == PayoutStatus.failed
    assert result.failure_reason == "bank declined"
