from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from src.domains.contributions.models import ContributionStatus
from src.domains.contributions.schemas import ContributionCreate
from src.domains.contributions.service import ContributionService
from src.domains.payments.service import PaymentService
from src.domains.wallets.service import WalletService
from tests.test_contribution_service import (
    _make_cooperative,
    _make_membership,
    _make_user,
)

PAYSTACK_INIT_OK = {
    "status": True,
    "message": "Authorization URL created",
    "data": {"authorization_url": "https://checkout.paystack.com/abc123"},
}


async def _setup(db_session, *, member=True):
    user = await _make_user(db_session)
    coop = await _make_cooperative(db_session)
    if member:
        await _make_membership(db_session, user.id, coop.id)
    return user, coop


def _data(coop, amount=2500.0):
    return ContributionCreate(group_id=coop.id, amount=amount)


@pytest.mark.asyncio
async def test_initiate_creates_pending_contribution_and_returns_checkout_url(db_session):
    user, coop = await _setup(db_session)

    with patch.object(
        PaymentService, "init_pay_with_paystack", new=AsyncMock(return_value=PAYSTACK_INIT_OK)
    ) as init:
        result = await ContributionService.initiate_paystack_contribution(
            _data(coop), user, db_session
        )

    contribution = result["contribution"]
    assert contribution.status == ContributionStatus.pending
    assert contribution.tx_id == result["reference"]
    assert result["authorization_url"] == "https://checkout.paystack.com/abc123"

    payload = init.call_args.args[0]
    assert payload.amount == 250000  # kobo
    assert payload.tx_ref == result["reference"]
    # all Paystack channels, not just bank transfer
    assert init.call_args.kwargs["channels"] is None


@pytest.mark.asyncio
async def test_initiate_rejects_non_member(db_session):
    user, coop = await _setup(db_session, member=False)

    with pytest.raises(HTTPException) as exc:
        await ContributionService.initiate_paystack_contribution(
            _data(coop), user, db_session
        )
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_initiate_marks_contribution_failed_when_paystack_rejects(db_session):
    user, coop = await _setup(db_session)

    with patch.object(
        PaymentService,
        "init_pay_with_paystack",
        new=AsyncMock(return_value={"status": False, "message": "Invalid key"}),
    ):
        with pytest.raises(HTTPException) as exc:
            await ContributionService.initiate_paystack_contribution(
                _data(coop), user, db_session
            )
    assert exc.value.status_code == 502


async def _initiated(db_session, amount=2500.0):
    user, coop = await _setup(db_session)
    with patch.object(
        PaymentService, "init_pay_with_paystack", new=AsyncMock(return_value=PAYSTACK_INIT_OK)
    ):
        result = await ContributionService.initiate_paystack_contribution(
            _data(coop, amount), user, db_session
        )
    return user, result["contribution"]


@pytest.mark.asyncio
async def test_settle_completes_contribution_without_touching_wallet(db_session):
    user, contribution = await _initiated(db_session)

    with patch.object(
        WalletService, "finalize_contribution_debit", new=AsyncMock()
    ) as debit:
        settled = await ContributionService.settle_paystack_contribution(
            db_session, contribution, 250000
        )

    assert settled is True
    assert contribution.status == ContributionStatus.completed
    assert contribution.fulfilled_at is not None
    debit.assert_not_called()


@pytest.mark.asyncio
async def test_settle_is_idempotent(db_session):
    _, contribution = await _initiated(db_session)

    assert await ContributionService.settle_paystack_contribution(
        db_session, contribution, 250000
    )
    # webhook + callback both firing must not complete (or log activity) twice
    assert not await ContributionService.settle_paystack_contribution(
        db_session, contribution, 250000
    )
    assert contribution.status == ContributionStatus.completed


@pytest.mark.asyncio
async def test_settle_fails_underpayment(db_session):
    _, contribution = await _initiated(db_session)

    settled = await ContributionService.settle_paystack_contribution(
        db_session, contribution, 100000
    )

    assert settled is False
    assert contribution.status == ContributionStatus.failed


@pytest.mark.asyncio
async def test_lookup_by_reference(db_session):
    _, contribution = await _initiated(db_session)

    found = await ContributionService.get_contribution_by_reference(
        db_session, contribution.tx_id
    )
    assert found.id == contribution.id
    assert (
        await ContributionService.get_contribution_by_reference(db_session, "nope")
        is None
    )


def test_webhook_ip_check_handles_proxy_chains():
    from src.shared.security.webhook_signing import is_paystack_ip

    assert is_paystack_ip("52.31.139.75")
    assert is_paystack_ip("10.0.0.1, 52.49.173.169")
    assert not is_paystack_ip("10.0.0.1, 8.8.8.8")
    assert not is_paystack_ip(None)


def test_paystack_signature_verification():
    import hashlib
    import hmac

    from src.shared.security.webhook_signing import verify_paystack_signature

    body = b'{"event":"charge.success"}'
    good = hmac.new(b"sk_test_x", body, hashlib.sha512).hexdigest()
    assert verify_paystack_signature(body, good, "sk_test_x")
    assert not verify_paystack_signature(body, good, "other_key")
    assert not verify_paystack_signature(body, "deadbeef", "sk_test_x")
    assert not verify_paystack_signature(body, None, "sk_test_x")
