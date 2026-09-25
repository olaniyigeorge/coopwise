from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from src.domains.payments.schemas import PaystackPayload
from src.domains.payments.service import PaymentService


def _make_response(json_body, status_code=200):
    response = MagicMock()
    response.json.return_value = json_body
    response.text = str(json_body)
    response.status_code = status_code
    return response


def _payload(**overrides):
    data = dict(amount=10000, email="user@example.com", currency="NGN", tx_ref="tx-123")
    data.update(overrides)
    return PaystackPayload(**data)


@pytest.mark.asyncio
async def test_init_pay_with_paystack_returns_gateway_body_verbatim():
    with patch(
        "src.domains.payments.service.requests.post",
        return_value=_make_response({"status": True, "data": {"authorization_url": "https://x"}}),
    ):
        result = await PaymentService.init_pay_with_paystack(_payload())

    assert result["status"] is True


@pytest.mark.asyncio
async def test_init_pay_with_paystack_does_not_check_gateway_status_flag():
    """Documents a real gap: unlike verify_paystack_transaction, this method
    returns the raw body even when Paystack itself reports failure (status:
    False) — callers must check `.status` themselves; nothing here does."""
    with patch(
        "src.domains.payments.service.requests.post",
        return_value=_make_response({"status": False, "message": "Invalid key"}),
    ):
        result = await PaymentService.init_pay_with_paystack(_payload())

    assert result["status"] is False  # no exception raised despite the failure


@pytest.mark.asyncio
async def test_init_pay_with_paystack_raises_500_on_network_error():
    with patch(
        "src.domains.payments.service.requests.post",
        side_effect=ConnectionError("network down"),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await PaymentService.init_pay_with_paystack(_payload())
    assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_verify_paystack_transaction_raises_400_on_gateway_failure():
    with patch(
        "src.domains.payments.service.requests.get",
        return_value=_make_response({"status": False, "message": "Transaction not found"}),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await PaymentService.verify_paystack_transaction("some-ref")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_verify_paystack_transaction_happy_path():
    with patch(
        "src.domains.payments.service.requests.get",
        return_value=_make_response({"status": True, "data": {"status": "success"}}),
    ):
        result = await PaymentService.verify_paystack_transaction("some-ref")
    assert result["status"] is True


@pytest.mark.asyncio
async def test_create_paystack_transfer_recipient_happy_path():
    with patch(
        "src.domains.payments.service.requests.post",
        return_value=_make_response({"status": True, "data": {"recipient_code": "RCP_123"}}),
    ):
        code = await PaymentService.create_paystack_transfer_recipient(
            account_number="0123456789", bank_code="058", account_name="Test User"
        )
    assert code == "RCP_123"


@pytest.mark.asyncio
async def test_create_paystack_transfer_recipient_raises_502_on_gateway_failure():
    with patch(
        "src.domains.payments.service.requests.post",
        return_value=_make_response({"status": False, "message": "Invalid bank code"}),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await PaymentService.create_paystack_transfer_recipient(
                account_number="0123456789", bank_code="000", account_name="Test User"
            )
    assert exc_info.value.status_code == 502


@pytest.mark.asyncio
async def test_initiate_paystack_transfer_happy_path():
    with patch(
        "src.domains.payments.service.requests.post",
        return_value=_make_response({"status": True, "data": {"reference": "ref-abc"}}),
    ):
        result = await PaymentService.initiate_paystack_transfer(
            amount=100, recipient_code="RCP_123", reference="ref-abc", reason="payout"
        )
    assert result["reference"] == "ref-abc"


@pytest.mark.asyncio
async def test_initiate_paystack_transfer_raises_502_on_gateway_failure():
    with patch(
        "src.domains.payments.service.requests.post",
        return_value=_make_response({"status": False, "message": "Insufficient balance"}),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await PaymentService.initiate_paystack_transfer(
                amount=100, recipient_code="RCP_123", reference="ref-abc", reason="payout"
            )
    assert exc_info.value.status_code == 502


@pytest.mark.asyncio
async def test_unimplemented_rails_raise_not_implemented():
    with pytest.raises(NotImplementedError):
        await PaymentService.pay_with_cashramp(
            amount=100,
            currency="NGN",
            customer_id="cust-1",
            payment_type="deposit",
            payment_method_type="bank_transfer_ng",
            reference="ref-1",
            proof_of_payment="none",
        )

    with pytest.raises(NotImplementedError):
        await PaymentService.pay_with_solana()

    with pytest.raises(NotImplementedError):
        await PaymentService.pay_with_coopwise_network()
