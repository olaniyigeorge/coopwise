from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

import pytest

from src.domains.contributions.models import Contribution, ContributionStatus
from src.domains.cooperatives.models.cooperative import CoopCooperative
from src.domains.cooperatives.models.enums import CooperativeModel, CooperativeStatus
from src.domains.kyc.models import KYCBankingInfo, KYCStatus, KYCStepStatus, KYCVerification
from src.domains.memberships.models.enums import MembershipRole, MembershipStatus
from src.domains.memberships.models.group_membership import GroupMembership
from src.domains.payments.models import PayoutStatus
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
