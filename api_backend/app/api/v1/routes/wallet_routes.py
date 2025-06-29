from datetime import datetime
from decimal import Decimal
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from app.services.user_service import UserService
from app.core.config import config
from app.services import cashramp_service
from app.services.notification_service import NotificationService
from app.services.payment_service import PaymentService
from db.models.wallet_models import LedgerType
from app.schemas.notifications_schema import NotificationCreate
from db.dependencies import get_async_db_session
from app.services.wallet_service import WalletService
from app.schemas.auth import AuthenticatedUser
from app.schemas.wallet_schemas import WalletDeposit, WalletWithdraw, WalletBalance, WalletDetail
from app.core.dependencies import get_current_user, get_redis

router = APIRouter(
    prefix="/api/v1/wallet", 
    tags=["Wallet"]
    )

CUTOFF_DATE = datetime.fromisoformat("2025-06-30T00:00:00") # Mock payment cutoff date


@router.post(
    "/deposit",
    response_model=WalletDetail,
    summary="Deposit money into your Coopwise account"
)
async def deposit(
    deposit_data: WalletDeposit,
    payment_gateway: str = "mock-success", 
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis)

):
    # 1. Send user notification about deposit initiation
    noti_data = NotificationCreate(
        user_id=user.id,
        title="Deposit initiated",
        message=f"You have attempted a deposit of {deposit_data.currency} {deposit_data.local_amount} into your Coopwise wallet.",
        event_type="general_alert",
        type="info",
        entity_url=f"deposit-{user.id}:{deposit_data.local_amount}"
    )
    await NotificationService.create_and_push_notification_to_user(noti_data, db)

    user_detail = await UserService.get_user_by_id(db, user.id)

    # Choose from a list of payment gateways
    if payment_gateway == "paystack":
        from app.schemas.payments import PaystackPayload  # Import if not already
        payment_payload = PaystackPayload(
            amount=int(Decimal(deposit_data.local_amount) * 100),  # Paystack expects amount in kobo
            email=user.email,
            currency=deposit_data.currency,
            tx_ref=str(uuid.uuid4),  # Unique transaction reference
            fullname=user_detail.full_name,
            phone_number=user_detail.phone_number,
            client_ip="154.123.220.1",  # Replace with actual client IP if available
            device_fingerprint="62wd23423rq324323qew1",  # Replace with actual fingerprint
            meta={
                "sideNote": "Deposit for Coopwise wallet",
            },
            is_permanent=False
        )
        deposit_payment = await PaymentService.init_pay_with_paystack(payment_payload)
    elif payment_gateway == "cashramp":
        deposit_payment = await PaymentService.pay_with_cashramp(
            str(uuid.uuid4), Decimal(deposit_data.local_amount)
        )
    elif payment_gateway == "on-chain_solana":
        # Implement Solana payment logic here
        deposit_payment = await PaymentService.pay_with_solana(
            str(uuid.uuid4), Decimal(deposit_data.local_amount)
        )
    elif payment_gateway == "coopwise_network_on_solana":
        # Implement Coopwise network on Solana logic here
        deposit_payment = await PaymentService.pay_with_coopwise_network(
            str(uuid.uuid4), Decimal(deposit_data.local_amount)
        )
    elif payment_gateway == "mock-success":
        if config.ENV != "dev" and datetime.now() > CUTOFF_DATE:
                raise HTTPException(status_code=400, detail="Mock payment is only available in production till 30th of June.")
        print("\nMocking successful deposit payment \n")
        deposit_payment = {"status": True, "message": "Deposit successful", "data": {"amount": deposit_data.local_amount}}

    elif payment_gateway == "mock-fail":
        if config.ENV != "dev" and datetime.now() > CUTOFF_DATE:
                raise HTTPException(status_code=400, detail="Mock payment is only available in production till 30th of June.")
        print("\nMocking successful deposit payment \n")
        deposit_payment = {"status": False, "message": "Payment failed", "data": {"amount": deposit_data.local_amount}}
        raise HTTPException(status_code=400, detail=f"{deposit_payment}")
    else:
        raise HTTPException(status_code=400, detail="Unsupported payment gateway.")




    # # 2. Fetch or create the user's wallet
    # user_wallet = await WalletService.get_wallet(db, user, redis)

    # # 3. Get quote from CashRamp
    # ramp_quote = await cashramp_service.get_ramp_quote(
    #     amount=int(data.local_amount),
    #     currency=data.currency,
    #     customer=user.id,
    #     paymentType="deposit",
    #     paymentMethodType="bank_transfer_ng",
    #     redis=redis
    # )

    # # 4. Record a pending ledger entry
    # stable_amount = Decimal(ramp_quote["exchangeRate"]) * Decimal(data.local_amount)
    # ledger_data = WalletLedger(
    #     wallet_id=user_wallet.id,
    #     type=LedgerType.deposit,
    #     stable_amount=stable_amount,
    #     local_amount=Decimal(data.local_amount),
    #     local_currency=data.currency,
    #     exchange_rate=Decimal(ramp_quote["exchangeRate"])
    # )
    # ledger = await WalletService.record_ledger_entry(ledger_data, db)

    # # 5. Initiate payment with CashRamp
    # payment_result = await PaymentService.pay_with_cashramp(
    #     reference=str(ledger.id),
    #     amount=Decimal(data.local_amount)
    # )
    # if not payment_result.get("status", False):
    #     raise HTTPException(status_code=400, detail="Payment failed.")

    # 6. Finalize the deposit logic (updates wallet balance)
    # If payment is successful, update the wallet balance
    updated_wallet = await WalletService.deposit(deposit_data, db, user, redis_client)

    # 7. Return updated wallet detail
    return updated_wallet




@router.get("/get-wallet", response_model=WalletDetail)
async def get_wallet(
    db: AsyncSession = Depends(get_async_db_session), 
    user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis)
    ):

    return await WalletService.get_wallet(db, user, redis_client)

@router.post("/withdraw")
async def withdraw(
    data: WalletWithdraw,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis)
):
    return await WalletService.withdraw(data, db, user, redis_client)
