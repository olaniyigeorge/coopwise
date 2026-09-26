import hmac
import hashlib
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from fastapi.responses import RedirectResponse
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from src.shared.utils.logger import logger
from src.infra.cache.redis_client import get_redis
from src.api.middlewares.dependencies import get_current_user
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.payments.schemas import PaystackPayload, PayoutRecordRead
from src.domains.contributions.service import ContributionService
from src.domains.memberships.models.enums import MembershipRole
from src.domains.memberships.service import CooperativeMembershipService
from src.domains.wallets.service import WalletService
from src.domains.wallets.models import LedgerStatus
from config import AppConfig as config
from src.domains.payments.service import PaymentService, PayoutService, PayoutError


from src.infra.db.dependencies import get_async_db_session

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
    redis: Redis = Depends(get_redis),
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

    if event in ("transfer.success", "transfer.failed", "transfer.reversed"):
        payout_record = await PayoutService.mark_payout_from_webhook(
            db=db,
            reference=reference,
            success=event == "transfer.success",
            failure_reason=None if event == "transfer.success" else data.get("reason"),
        )
        if not payout_record:
            return {"message": "No matching payout record for reference."}
        return {"message": f"Payout {payout_record.status.value}."}

    if event != "charge.success" or status_ != "success":
        return {"message": "Ignored non-success event."}

    try:
        # Step 3: Fetch the related ledger entry by reference
        payment = await WalletService.get_wallet_ledger_by_reference(reference, db)

        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found.")

        if payment.status == LedgerStatus.settled:
            return {"message": "Payment already settled."}

        # Step 4: Settle the ledger and credit the wallet
        await WalletService.finalize_deposit(reference, db, redis)

        # Step 5: Update related contribution record, if this deposit was tied to one
        if payment.contribution_id:
            await ContributionService.update_contribution_status(
                db=db,
                contribution_id=payment.contribution_id,
                contribution_status="completed",
                paid_at=datetime.now(),
            )
            return {"message": "Payment and contribution updated successfully."}

        return {"message": "Payment updated successfully."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook processing error: {e}", exc_info=True)
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
        return RedirectResponse(
            url=f"{config.CLIENT_DOMAIN}/dashboard/wallet/fund?status=failed&ref={reference}"
        )

    await WalletService.finalize_deposit(reference, db, redis)

    return RedirectResponse(
        url=f"{config.CLIENT_DOMAIN}/dashboard/wallet/fund?status=success&ref={reference}"
    )


@router.post(
    "/payouts/{group_id}/execute",
    response_model=PayoutRecordRead,
    summary="Execute the next fiat payout for a group",
)
async def execute_group_payout(
    group_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
):
    membership = await CooperativeMembershipService.get_membership_by_user_and_group(
        user_id=user.id, group_id=group_id, db=db
    )
    if (
        not membership
        or not membership.is_active
        or membership.role != MembershipRole.admin
    ):
        raise HTTPException(
            status_code=403,
            detail="Only an active group admin can execute a payout.",
        )

    try:
        return await PayoutService.execute_payout(db=db, group_id=group_id)
    except PayoutError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/payouts/{group_id}",
    response_model=list[PayoutRecordRead],
    summary="Get a group's payout history",
)
async def get_group_payout_history(
    group_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
):
    membership = await CooperativeMembershipService.get_membership_by_user_and_group(
        user_id=user.id, group_id=group_id, db=db
    )
    if not membership or not membership.is_active:
        raise HTTPException(
            status_code=403, detail="You are not an active member of this group."
        )
    return await PayoutService.get_payout_history(db=db, group_id=group_id)


@router.get(
    "/payouts/me",
    response_model=list[PayoutRecordRead],
    summary="Get the current user's fiat payout history",
)
async def get_my_payout_history(
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
):
    return await PayoutService.get_payouts_for_user(db=db, user_id=user.id)


# @router.get("/cashramp/account-info", summary="Get merchant account information")
# async def get_account_info(cashramp: CashRampService = Depends(get_cashramp_service)):
#     """
#     Retrieves the current merchant account info from CacheRAMP, including balance.
#     """
#     return await cashramp.get_account_info()


# @router.post("/cashramp/customer", response_model=CustomerResponse)
# async def create_customer(
#     email: str,
#     first_name: str,
#     last_name: str,
#     country_id: str,
#     cashramp: CashRampService = Depends(get_cashramp_service),
# ):
#     return await cashramp.create_customer(email, first_name, last_name, country_id)


# @router.get("/cashramp/quote", response_model=RampQuoteResponse)
# async def get_quote(
#     amount: float,
#     currency: str,
#     customer_id: str,
#     payment_type: str,
#     payment_method_type: str,
#     cashramp: CashRampService = Depends(get_cashramp_service),
# ):
#     return await cashramp.get_ramp_quote(
#         amount, currency, customer_id, payment_type, payment_method_type
#     )


# @router.post("/cashramp/deposit", response_model=InitiateDepositResponse)
# async def initiate_deposit(
#     ramp_quote_id: str,
#     reference: Optional[str] = None,
#     cashramp: CashRampService = Depends(get_cashramp_service),
# ):
#     return await cashramp.initiate_deposit(ramp_quote_id, reference)


# @router.post("/cashramp/deposit/paid")
# async def mark_deposit_as_paid(
#     payment_request_id: str,
#     receipt_url: Optional[str] = None,
#     cashramp: CashRampService = Depends(get_cashramp_service),
# ):
#     return await cashramp.mark_deposit_as_paid(payment_request_id, receipt_url)


# @router.post("/cashramp/deposit/cancel")
# async def cancel_deposit(
#     payment_request_id: str, cashramp: CashRampService = Depends(get_cashramp_service)
# ):
#     return await cashramp.cancel_deposit(payment_request_id)
