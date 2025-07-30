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
from app.services.payment_service import COOPWISE_USD_NGN_RATE, PaymentService
from db.models.wallet_models import (
    LedgerStatus,
    LedgerType,
    PaymentGateway,
    StableCurrency,
)
from app.schemas.notifications_schema import NotificationCreate
from db.dependencies import get_async_db_session
from app.services.wallet_service import WalletService
from app.schemas.auth import AuthenticatedUser
from app.schemas.wallet_schemas import (
    WalletDeposit,
    WalletLedgerCreate,
    WalletWithdraw,
    WalletBalance,
    WalletDetail,
)
from app.core.dependencies import get_current_user, get_redis
from app.utils.logger import logger


router = APIRouter(prefix="/api/v1/wallet", tags=["Wallet"])

CUTOFF_DATE = datetime.fromisoformat("2025-07-30T00:00:00")  # Mock payment cutoff date


@router.post(
    "/deposit/initiate",
    # TODO Add a response model that works for all payment methods
    summary="Initiate deposit into your Coopwise wallet via supported payment gateway",
)
async def initiate_deposit(
    deposit_data: WalletDeposit,
    payment_gateway: str = "mock_success",
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    tx_ref_uuid = (
        uuid.uuid4()
    )  # TODO Check possibility of confirming if Unique transaction reference is not an existing wallet ledger record

    user_detail = await UserService.get_user_by_id(db, user.id)

    # Choose from a list of payment gateways
    if payment_gateway == "paystack":
        from app.schemas.payments import PaystackPayload

        payment_payload = PaystackPayload(
            amount=int(Decimal(deposit_data.local_amount) * 100),
            email=user.email,
            currency=deposit_data.currency,
            tx_ref=str(tx_ref_uuid),
            fullname=user_detail.full_name,
            phone_number=user_detail.phone_number,
            client_ip="154.123.220.1",
            device_fingerprint="62wd23423rq324323qew1",  # TODO Read more about device_fingerprints
            meta={
                "sideNote": "Deposit into Coopwise wallet",
            },
            is_permanent=False,
        )
        # deposit_payment = await PaymentService.init_pay_with_paystack(payment_payload)
        init_payment_response = await PaymentService.init_pay_with_paystack(
            payment_payload
        )

        if not init_payment_response["status"]:
            raise HTTPException(
                status_code=400, detail=init_payment_response["message"]
            )
        wallet = await WalletService.get_wallet(db, user, redis_client)

        ledger_data = WalletLedgerCreate(
            wallet_id=wallet.id,
            type=LedgerType.deposit,
            local_amount=Decimal(deposit_data.local_amount),
            stable_amount=Decimal(deposit_data.local_amount)
            * Decimal(COOPWISE_USD_NGN_RATE),
            stable_currency=StableCurrency.usdc,
            local_currency=deposit_data.currency,
            exchange_rate=COOPWISE_USD_NGN_RATE,
            reference=str(tx_ref_uuid),
            status=LedgerStatus.initiated,
            gateway=payment_gateway,
            note="Deposit initiated from API",
        )
        await WalletService.record_ledger_entry(ledger_data, db)
    elif payment_gateway == "cashramp":
        init_payment_response = await PaymentService.pay_with_cashramp(
            str(uuid.uuid4), Decimal(deposit_data.local_amount)
        )
    elif payment_gateway == "on_chain_solana":
        # Implement Solana payment logic here
        init_payment_response = await PaymentService.pay_with_solana(
            str(uuid.uuid4), Decimal(deposit_data.local_amount)
        )
    elif payment_gateway == "coopwise_network_on_solana":
        # Implement Coopwise network on Solana logic here
        init_payment_response = await PaymentService.pay_with_coopwise_network(
            str(uuid.uuid4), Decimal(deposit_data.local_amount)
        )
    elif payment_gateway == "mock_success":
        if config.ENV != "dev" and datetime.now() > CUTOFF_DATE:
            raise HTTPException(
                status_code=400,
                detail="Mock payment is only available in production till 30th of June.",
            )
        logger.info("\nMocking successful deposit payment \n")
        init_payment_response = {
            "status": True,
            "message": "Deposit successful",
            "data": {"amount": deposit_data.local_amount, "tx_ref": str(tx_ref_uuid)},
        }

        wallet = await WalletService.get_wallet(db, user, redis_client)

        ledger_data = WalletLedgerCreate(
            wallet_id=wallet.id,
            type=LedgerType.deposit,
            local_amount=Decimal(deposit_data.local_amount),
            stable_amount=Decimal(deposit_data.local_amount)
            * Decimal(COOPWISE_USD_NGN_RATE),
            stable_currency=StableCurrency.usdc,
            local_currency=deposit_data.currency,
            exchange_rate=COOPWISE_USD_NGN_RATE,
            reference=str(tx_ref_uuid),
            status=LedgerStatus.initiated,
            gateway="cash",
            note="Deposit initiated from API",
        )
        await WalletService.record_ledger_entry(ledger_data, db)
    elif payment_gateway == "mock_fail":
        if config.ENV != "dev" and datetime.now() > CUTOFF_DATE:
            raise HTTPException(
                status_code=400,
                detail="Mock payment is only available in production till 30th of June.",
            )
        logger.info("\nMocking successful deposit payment \n")
        init_payment_response = {
            "status": False,
            "message": "Payment failed",
            "data": {"amount": deposit_data.local_amount},
        }
        raise HTTPException(status_code=400, detail=f"{init_payment_response}")
    else:
        raise HTTPException(status_code=400, detail="Unsupported payment gateway.")

    # Send user notification about deposit initiation
    noti_data = NotificationCreate(
        user_id=user.id,
        title="Deposit initiated",
        message=f"You have attempted a deposit of {deposit_data.currency} {deposit_data.local_amount} into your Coopwise wallet through {payment_gateway}",
        event_type="transaction",
        type="info",
        entity_url=f"tx_ref-{tx_ref_uuid}",
    )
    await NotificationService.create_and_push_notification_to_user(noti_data, db)

    return {
        "payment_gateway": payment_gateway,
        "init_payment_response": init_payment_response,
    }


@router.post(
    "/deposit/finalise",
    summary="Finalise deposit by verifying transaction with reference",
)
async def finalise_deposit(
    reference: str,
    payment_gateway: str,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
):
    
    supported_gateways = [
        "mock_success",
        "mock_fail",
        "paystack",
        "flutterwave",
        "cashramp",
        "on_chain_solana",
        "on_chain_cashramp"
        "coopwise_network_on_solana",
        "cash"
    ]

    if payment_gateway not in supported_gateways: # PaymentGateway.__members__  
        raise HTTPException(status_code=400, detail="Unsupported payment method.")

    verification_result = False
    ledger_record = None

    # --- Gateway-Specific Verification Logic ---
    if payment_gateway == "mock_success":
        verification_result = True
        ledger_record = await WalletService.get_wallet_ledger_by_reference(reference, db)
    elif payment_gateway == "mock_fail":
        verification_result = False
    elif payment_gateway == "paystack":
        raise HTTPException(status_code=501, detail="Paystack verification not yet implemented.")
    elif payment_gateway == "cashramp":
        raise HTTPException(status_code=501, detail="Cashramp verification not yet implemented.")
    elif payment_gateway == "on_chain_cashramp":
        raise HTTPException(status_code=501, detail="On-chain Cashramp verification not yet implemented.")
    elif payment_gateway == "coopwise_network_on_solana":
        raise HTTPException(status_code=501, detail="Coopwise Network on Solana not yet implemented.")


    if not verification_result: # Compress all verification_results into a clear(comparable) return type
        raise HTTPException(status_code=400, detail="Transaction verification failed.")

    if not ledger_record:
        ledger_record = await WalletService.get_wallet_ledger_by_reference(reference, db)

    if ledger_record.status != LedgerStatus.initiated:
        raise HTTPException(status_code=400, detail="Transaction already processed or invalid.")

    logger.info(f"\n✅ Payment verified for reference: {reference} by {payment_gateway}. Settling into wallet...\n")


    # Use transaction block to ensure consistency
    updated_wallet = await WalletService.settle_payment_ledger_into_wallet(
            ledger_record.id, db, redis
    )

    return {
        "message": "Deposit finalised successfully.",
        "receipt": {
            "ledger_id": ledger_record.id,
            "amount": ledger_record.stable_amount,
            "status": "settled",
            "reference": ledger_record.reference,
        },
    }

@router.get("/get-wallet", response_model=WalletDetail)
async def get_wallet(
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):

    return await WalletService.get_wallet(db, user, redis_client)


@router.post("/withdraw")
async def withdraw(
    data: WalletWithdraw,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    return await WalletService.withdraw(data, db, user, redis_client)
