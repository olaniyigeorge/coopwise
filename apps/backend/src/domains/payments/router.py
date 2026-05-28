import hmac
import hashlib
from apps.backend.src.infra.payments.cashramp_schemas import CustomerResponse, RampQuoteResponse
from apps.backend.src.infra.payments.cashramp_service import CashRampService
from fastapi import APIRouter, Request, Header, HTTPException, status, Depends
from fastapi.responses import RedirectResponse
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from apps.backend.src.shared.utils.logger import logger
from apps.backend.src.api.middlewares.dependencies import get_cashramp_service, get_redis
from apps.backend.app.api.routers.v1.auth import get_current_user
from apps.backend.src.domains.auth.schemas import AuthenticatedUser
from apps.backend.src.domains.payments.schemas import PaystackPayload
from apps.backend.src.domains.contributions.service import ContributionService
from apps.backend.src.domains.wallets.service import WalletService
from config import AppConfig as config
from apps.backend.src.domains.contributions.models import Contribution
from apps.backend.src.domains.payments.service import PaymentService



import hmac
import hashlib
from fastapi import APIRouter, Request, Header, HTTPException, status, Depends
from fastapi.responses import RedirectResponse
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from apps.backend.src.shared.utils.logger import logger
from apps.backend.src.api.middlewares.dependencies import get_redis
from apps.backend.app.api.routers.v1.auth import get_current_user
from apps.backend.src.domains.auth.schemas import AuthenticatedUser
from apps.backend.src.domains.payments.schemas import PaystackPayload
from apps.backend.src.domains.contributions.service import ContributionService
from apps.backend.src.domains.wallets.service import WalletService
from config import AppConfig as config
from apps.backend.src.coopwise_infra.db.dependencies import get_async_db_session
from apps.backend.src.domains.contributions.models import Contribution
from apps.backend.src.domains.payments.service import PaymentService

router = APIRouter(prefix="/api/v1/payments", tags=["Payments & Integrations"])

PAYSTACK_WHITELIST = ["52.31.139.75", "52.49.173.169", "52.214.14.220"]


@router.get("/deposit-with-paystack", summary="Verify Paystack Payment")
async def deposit_with_paystack(
    payload: PaystackPayload,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Deposit with Paystack .
    """

    pass


@router.post("/paystack/webhook", summary="Paystack Webhook Handler")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Handles Paystack Webhook notifications and updates the contribution/payment records.
    """
    body = await request.body()

    # Step 1: Verify source IP and signature
    if x_forwarded_for not in PAYSTACK_WHITELIST:
        raise HTTPException(status_code=403, detail="Invalid IP address")

    secret = config.PAYSTACK_SECRET_KEY.encode("utf-8")
    expected_signature = hmac.new(secret, body, hashlib.sha512).hexdigest()

    if x_paystack_signature != expected_signature:
        raise HTTPException(status_code=403, detail="Invalid signature")

    # Step 2: Deserialize JSON payload
    payload = await request.json()
    event = payload.get("event")
    data = payload.get("data", {})
    reference = data.get("reference")
    status_ = data.get("status")
    amount = data.get("amount") / 100  # Convert back to naira

    if event != "charge.success" or status_ != "success":
        return {"message": "Ignored non-success event."}

    try:
        # Step 3: Fetch the related contribution & payment by reference
        payment = await WalletService.get_wallet_ledger(reference, db)

        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found.")

        if payment.status in ["settled", "completed"]:
            return {"message": "Payment already settled."}

        # Step 4: Update payment record
        payment.status = "settled"
        payment.local_amount = amount
        payment.stable_amount = amount
        payment.gateway = data.get("channel")
        payment.updated_at = data.get("paid_at")
        await db.commit()

        # Step 5: Update related contribution record
        if payment.contribution:
            await ContributionService.update_contribution_status(
                db=db,
                contribution_id=payment.contribution_id,
                contribution_status="completed",
                paid_at=payment.updated_at,
            )
            return {"message": "Payment and contribution updated successfully."}

        return {"message": "Payment updated successfully."}

    except Exception as e:
        logger.info("Webhook processing error:", str(e))
        raise HTTPException(status_code=500, detail="Webhook processing failed.")


@router.get("/paystack/callback", summary="Paystack Payment Callback")
async def paystack_callback(
    request: Request,
    # reference: str,
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis),
):
    reference = request.query_params.get("reference")
    if not reference:
        raise HTTPException(status_code=400, detail="Missing transaction reference")

    verification = await PaymentService.verify_paystack_transaction(reference)

    if not verification["status"] or verification["data"]["status"] != "success":
        # return RedirectResponse(url=f"{config.CLIENT_DOMAIN}/payment?status=failed&ref={reference}")
        return f"{config.CLIENT_DOMAIN}/payment?status=failed&ref={reference}"

    await WalletService.finalize_deposit(reference, db, redis)
    # return RedirectResponse(url=f"{config.CLIENT_DOMAIN}?status=success&ref={reference}")

    return f"{config.CLIENT_DOMAIN}?status=success&ref={reference}"




router = APIRouter(prefix="/api/v1/payments", tags=["Payments & Integrations"])

PAYSTACK_WHITELIST = ["52.31.139.75", "52.49.173.169", "52.214.14.220"]


@router.get("/deposit-with-paystack", summary="Verify Paystack Payment")
async def deposit_with_paystack(
    payload: PaystackPayload,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Deposit with Paystack .
    """

    pass


@router.post("/paystack/webhook", summary="Paystack Webhook Handler")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Handles Paystack Webhook notifications and updates the contribution/payment records.
    """
    body = await request.body()

    # Step 1: Verify source IP and signature
    if x_forwarded_for not in PAYSTACK_WHITELIST:
        raise HTTPException(status_code=403, detail="Invalid IP address")

    secret = config.PAYSTACK_SECRET_KEY.encode("utf-8")
    expected_signature = hmac.new(secret, body, hashlib.sha512).hexdigest()

    if x_paystack_signature != expected_signature:
        raise HTTPException(status_code=403, detail="Invalid signature")

    # Step 2: Deserialize JSON payload
    payload = await request.json()
    event = payload.get("event")
    data = payload.get("data", {})
    reference = data.get("reference")
    status_ = data.get("status")
    amount = data.get("amount") / 100  # Convert back to naira

    if event != "charge.success" or status_ != "success":
        return {"message": "Ignored non-success event."}

    try:
        # Step 3: Fetch the related contribution & payment by reference
        payment = await WalletService.get_wallet_ledger(reference, db)

        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found.")

        if payment.status in ["settled", "completed"]:
            return {"message": "Payment already settled."}

        # Step 4: Update payment record
        payment.status = "settled"
        payment.local_amount = amount
        payment.stable_amount = amount
        payment.gateway = data.get("channel")
        payment.updated_at = data.get("paid_at")
        await db.commit()

        # Step 5: Update related contribution record
        if payment.contribution:
            await ContributionService.update_contribution_status(
                db=db,
                contribution_id=payment.contribution_id,
                contribution_status="completed",
                paid_at=payment.updated_at,
            )
            return {"message": "Payment and contribution updated successfully."}

        return {"message": "Payment updated successfully."}

    except Exception as e:
        logger.info("Webhook processing error:", str(e))
        raise HTTPException(status_code=500, detail="Webhook processing failed.")


@router.get("/paystack/callback", summary="Paystack Payment Callback")
async def paystack_callback(
    request: Request,
    # reference: str,
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis),
):
    reference = request.query_params.get("reference")
    if not reference:
        raise HTTPException(status_code=400, detail="Missing transaction reference")

    verification = await PaymentService.verify_paystack_transaction(reference)

    if not verification["status"] or verification["data"]["status"] != "success":
        # return RedirectResponse(url=f"{config.CLIENT_DOMAIN}/payment?status=failed&ref={reference}")
        return f"{config.CLIENT_DOMAIN}/payment?status=failed&ref={reference}"

    await WalletService.finalize_deposit(reference, db, redis)
    # return RedirectResponse(url=f"{config.CLIENT_DOMAIN}?status=success&ref={reference}")

    return f"{config.CLIENT_DOMAIN}?status=success&ref={reference}"









@router.get("/cashramp/account-info", summary="Get merchant account information")
async def get_account_info(cashramp: CashRampService = Depends(get_cashramp_service)):
    """
    Retrieves the current merchant account info from CacheRAMP, including balance.
    """
    return await cashramp.get_account_info()


@router.post("/cashramp/customer", response_model=CustomerResponse)
async def create_customer(
    email: str,
    first_name: str,
    last_name: str,
    country_id: str,
    cashramp: CashRampService = Depends(get_cashramp_service),
):
    return await cashramp.create_customer(email, first_name, last_name, country_id)


@router.get("/cashramp/quote", response_model=RampQuoteResponse)
async def get_quote(
    amount: float,
    currency: str,
    customer_id: str,
    payment_type: str,
    payment_method_type: str,
    cashramp: CashRampService = Depends(get_cashramp_service),
):
    return await cashramp.get_ramp_quote(
        amount, currency, customer_id, payment_type, payment_method_type
    )


@router.post("/cashramp/deposit", response_model=InitiateDepositResponse)
async def initiate_deposit(
    ramp_quote_id: str,
    reference: Optional[str] = None,
    cashramp: CashRampService = Depends(get_cashramp_service),
):
    return await cashramp.initiate_deposit(ramp_quote_id, reference)


@router.post("/cashramp/deposit/paid")
async def mark_deposit_as_paid(
    payment_request_id: str,
    receipt_url: Optional[str] = None,
    cashramp: CashRampService = Depends(get_cashramp_service),
):
    return await cashramp.mark_deposit_as_paid(payment_request_id, receipt_url)


@router.post("/cashramp/deposit/cancel")
async def cancel_deposit(
    payment_request_id: str, cashramp: CashRampService = Depends(get_cashramp_service)
):
    return await cashramp.cancel_deposit(payment_request_id)
