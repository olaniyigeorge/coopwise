from uuid import UUID
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from fastapi.responses import RedirectResponse
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from src.shared.utils.logger import logger
from src.shared.security.webhook_signing import (
    is_paystack_ip,
    verify_paystack_signature,
)
from src.infra.cache.redis_client import get_redis
from src.api.middlewares.dependencies import get_current_user
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.payments.schemas import (
    MyPayoutRead,
    PaystackPayload,
    PayoutRecordRead,
    UpcomingPayoutRead,
)
from src.domains.contributions.service import ContributionService
from src.domains.memberships.models.enums import MembershipRole
from src.domains.memberships.service import CooperativeMembershipService
from src.domains.wallets.service import WalletService
from src.domains.wallets.models import LedgerStatus
from config import AppConfig as config
from src.domains.payments.service import PaymentService, PayoutService, PayoutError
from src.domains.notifications.service import NotificationService


from src.infra.db.dependencies import get_async_db_session

router = APIRouter(prefix="/api/v1/payments", tags=["Payments & Integrations"])


async def _notify_wallet_payment(
    *, db: AsyncSession, ledger, reference: str, status: str
) -> None:
    wallet = await WalletService.get_wallet_by_id(str(ledger.wallet_id), db)
    if not wallet:
        return

    currency = ledger.local_currency.value
    amount = ledger.local_amount
    messages = {
        "succeeded": (
            "Deposit successful",
            f"Your deposit of {currency} {amount} was completed successfully.",
        ),
        "failed": (
            "Deposit failed",
            f"Your deposit of {currency} {amount} failed. No funds were added to your wallet.",
        ),
        "abandoned": (
            "Deposit abandoned",
            f"Your deposit of {currency} {amount} was abandoned before completion.",
        ),
    }
    title, message = messages[status]
    await NotificationService.notify_transaction(
        db=db,
        user_id=wallet.user_id,
        reference=reference,
        status=status,
        title=title,
        message=message,
        entity_url="/dashboard/wallet/fund",
    )


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
    if not is_paystack_ip(x_forwarded_for):
        raise HTTPException(status_code=403, detail="Invalid IP address")

    if not verify_paystack_signature(
        body, x_paystack_signature, config.PAYSTACK_SECRET_KEY
    ):
        raise HTTPException(status_code=403, detail="Invalid signature")

    # Step 2: Deserialize JSON payload
    payload = await request.json()
    event = payload.get("event")
    data = payload.get("data", {})
    reference = data.get("reference")
    status_ = data.get("status")

    if event in ("transfer.success", "transfer.failed", "transfer.reversed"):
        withdrawal = await WalletService.get_withdrawal_by_provider_reference(
            reference, db
        )
        if withdrawal:
            is_success = event == "transfer.success"
            withdrawal = await WalletService.mark_withdrawal_from_provider(
                withdrawal,
                success=is_success,
                reversed=event == "transfer.reversed",
                reason=data.get("reason") or data.get("failure_reason"),
                db=db,
            )
            wallet = await WalletService.get_wallet_by_id(str(withdrawal.wallet_id), db)
            if wallet:
                await NotificationService.notify_transaction(
                    db=db,
                    user_id=wallet.user_id,
                    reference=withdrawal.reference,
                    status="succeeded" if is_success else "failed",
                    title=(
                        "Withdrawal successful"
                        if is_success
                        else "Withdrawal failed"
                    ),
                    message=(
                        "Your withdrawal has reached your bank account."
                        if is_success
                        else "Your bank withdrawal failed and the funds were returned to your wallet."
                    ),
                    entity_url="/dashboard/wallet/fund",
                )
            return {"message": f"Withdrawal {withdrawal.status.value}."}

        payout_record = await PayoutService.mark_payout_from_webhook(
            db=db,
            reference=reference,
            success=event == "transfer.success",
            failure_reason=None if event == "transfer.success" else data.get("reason"),
        )
        if not payout_record:
            return {"message": "No matching payout record for reference."}
        return {"message": f"Payout {payout_record.status.value}."}

    is_charge_event = event in ("charge.success", "charge.failed", "charge.abandoned")
    if not is_charge_event:
        return {"message": "Ignored non-success event."}

    payment_status = (
        "succeeded"
        if event == "charge.success" and status_ == "success"
        else "abandoned"
        if event == "charge.abandoned" or status_ == "abandoned"
        else "failed"
    )

    # Direct Paystack contribution (no wallet ledger): settle by reference
    direct = await ContributionService.get_contribution_by_reference(db, reference)
    if direct:
        if payment_status == "succeeded":
            await ContributionService.settle_paystack_contribution(
                db, direct, int(data.get("amount") or 0)
            )
        elif payment_status == "abandoned":
            await ContributionService.mark_contribution_cancelled(
                db, direct.id, data.get("gateway_response") or "Paystack checkout abandoned"
            )
        else:
            await ContributionService.mark_contribution_failed(
                db, direct.id, data.get("gateway_response") or "Paystack payment failed"
            )
        return {"message": "Contribution payment processed."}

    try:
        # Step 3: Fetch the related ledger entry by reference
        payment = await WalletService.get_wallet_ledger_by_reference(reference, db)

        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found.")

        if payment.status == LedgerStatus.settled:
            return {"message": "Payment already settled."}

        if payment_status != "succeeded":
            await WalletService.fail_deposit(reference, db)
            if payment.contribution_id:
                if payment_status == "abandoned":
                    await ContributionService.mark_contribution_cancelled(
                        db,
                        payment.contribution_id,
                        "Payment checkout abandoned",
                    )
                else:
                    await ContributionService.mark_contribution_failed(
                        db,
                        payment.contribution_id,
                        "Payment failed",
                    )
            await _notify_wallet_payment(
                db=db,
                ledger=payment,
                reference=reference,
                status=payment_status,
            )
            return {"message": f"Payment {payment_status}."}

        # Step 4: Settle the ledger and credit the wallet
        await WalletService.finalize_deposit(reference, db, redis)
        await _notify_wallet_payment(
            db=db, ledger=payment, reference=reference, status="succeeded"
        )

        # Step 5: Update related contribution record, if this deposit was tied to one
        if payment.contribution_id:
            await ContributionService.mark_contribution_success(
                db=db,
                contribution_id=payment.contribution_id,
                tx_hash=reference,
                debit_wallet=False,
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

    direct = await ContributionService.get_contribution_by_reference(db, reference)
    if direct:
        gateway_status = verification["data"].get("status")
        paid = gateway_status == "success"
        if paid:
            paid = (
                await ContributionService.settle_paystack_contribution(
                    db, direct, int(verification["data"].get("amount") or 0)
                )
                or direct.status.value == "completed"
            )
        elif gateway_status == "abandoned":
            await ContributionService.mark_contribution_cancelled(
                db, direct.id, "Paystack checkout abandoned"
            )
        else:
            await ContributionService.mark_contribution_failed(
                db, direct.id, "Paystack payment failed"
            )
        outcome = "success" if paid else gateway_status or "failed"
        return RedirectResponse(
            url=f"{config.CLIENT_DOMAIN}/payment/return?kind=contribution"
            f"&group={direct.group_id}&status={outcome}&ref={reference}"
        )

    gateway_status = verification["data"].get("status")
    if not verification["status"] or gateway_status != "success":
        ledger = await WalletService.get_wallet_ledger_by_reference(reference, db)
        if ledger:
            await WalletService.fail_deposit(reference, db)
            await _notify_wallet_payment(
                db=db,
                ledger=ledger,
                reference=reference,
                status="abandoned" if gateway_status == "abandoned" else "failed",
            )
        return RedirectResponse(
            url=f"{config.CLIENT_DOMAIN}/payment/return?kind=wallet&status={gateway_status or 'failed'}&ref={reference}"
        )

    ledger = await WalletService.get_wallet_ledger_by_reference(reference, db)
    await WalletService.finalize_deposit(reference, db, redis)
    if ledger:
        await _notify_wallet_payment(
            db=db, ledger=ledger, reference=reference, status="succeeded"
        )

    return RedirectResponse(
        url=f"{config.CLIENT_DOMAIN}/payment/return?kind=wallet&status=success&ref={reference}"
    )


@router.get(
    "/payouts/me",
    response_model=list[MyPayoutRead],
    summary="Get the current user's fiat payout history",
)
async def get_my_payout_history(
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
):
    return await PayoutService.list_for_user(db=db, user_id=user.id)


@router.get(
    "/payouts/upcoming",
    response_model=list[UpcomingPayoutRead],
    summary="Payout turns for the cooperatives the current user belongs to",
)
async def get_my_upcoming_payouts(
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
):
    return await PayoutService.list_upcoming_for_user(db=db, user_id=user.id)


@router.post(
    "/payouts/{group_id}/execute",
    response_model=list[PayoutRecordRead],
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
        return await PayoutService.dispatch_payout(
            db=db, group_id=group_id, automatic=False
        )
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
