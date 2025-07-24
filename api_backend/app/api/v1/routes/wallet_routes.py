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
from db.models.wallet_models import LedgerStatus, LedgerType, PaymentGateway, StableCurrency
from app.schemas.notifications_schema import NotificationCreate
from db.dependencies import get_async_db_session
from app.services.wallet_service import WalletService
from app.schemas.auth import AuthenticatedUser
from app.schemas.wallet_schemas import WalletDeposit, WalletLedgerCreate, WalletWithdraw, WalletBalance, WalletDetail
from app.core.dependencies import get_current_user, get_redis

router = APIRouter(
    prefix="/api/v1/wallet", 
    tags=["Wallet"]
    )

CUTOFF_DATE = datetime.fromisoformat("2025-07-30T00:00:00") # Mock payment cutoff date


@router.post(
    "/deposit/initiate",
    # TODO Add a response model that works for all payment methods
    summary="Initiate deposit into your Coopwise wallet via supported payment gateway"
)
async def initiate_deposit(
    deposit_data: WalletDeposit,
    payment_gateway: str = "mock_success", 
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis)
):
    tx_ref_uuid = uuid.uuid4()  #TODO Check possibility of confirming if Unique transaction reference is not an existing wallet ledger record


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
            device_fingerprint="62wd23423rq324323qew1",  #TODO Read more about device_fingerprints
            meta={
                "sideNote": "Deposit into Coopwise wallet",
            },
            is_permanent=False
        )
        # deposit_payment = await PaymentService.init_pay_with_paystack(payment_payload)
        init_payment_response = await PaymentService.init_pay_with_paystack(payment_payload)
        
        if not init_payment_response["status"]:
            raise HTTPException(status_code=400, detail=init_payment_response["message"])
        wallet = await WalletService.get_wallet(db, user, redis_client)
                
        ledger_data = WalletLedgerCreate(
            wallet_id=wallet.id,
            type=LedgerType.deposit,
            local_amount=Decimal(deposit_data.local_amount),
            stable_amount=Decimal(deposit_data.local_amount) * Decimal(COOPWISE_USD_NGN_RATE), 
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
                raise HTTPException(status_code=400, detail="Mock payment is only available in production till 30th of June.")
        print("\nMocking successful deposit payment \n")
        init_payment_response = {"status": True, "message": "Deposit successful", "data": {"amount": deposit_data.local_amount, "tx_ref": str(tx_ref_uuid)}}
        
        wallet = await WalletService.get_wallet(db, user, redis_client)
                
        ledger_data = WalletLedgerCreate(
            wallet_id=wallet.id,
            type=LedgerType.deposit,
            local_amount=Decimal(deposit_data.local_amount),
            stable_amount=Decimal(deposit_data.local_amount) * Decimal(COOPWISE_USD_NGN_RATE), 
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
                raise HTTPException(status_code=400, detail="Mock payment is only available in production till 30th of June.")
        print("\nMocking successful deposit payment \n")
        init_payment_response = {"status": False, "message": "Payment failed", "data": {"amount": deposit_data.local_amount}}
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
        entity_url=f"tx_ref-{tx_ref_uuid}"
    )
    await NotificationService.create_and_push_notification_to_user(noti_data, db)

    return {
         "payment_gateway": payment_gateway,
         "init_payment_response": init_payment_response
    }


@router.post(
    "/deposit/finalise",
    summary="Finalise deposit by verifying transaction with reference"
)
async def finalise_deposit(
    reference: str,
    payment_method: str,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
):
    if payment_method not in PaymentGateway.__members__:
        raise HTTPException(status_code=400, detail="Unsupported payment method.")

    result = None

    if payment_method == "paystack":
        result = await PaymentService.verify_paystack_transaction(reference)
    elif payment_method == "cashramp":
        # result = await PaymentService.verify_cashramp_transaction(reference)
         raise HTTPException(status_code=501, detail="Cashramp verification not yet implemented.")
    else:
        raise HTTPException(status_code=400, detail="Unsupported payment method.")

    if not result["status"] or result["data"]["status"] != "success":
        raise HTTPException(status_code=400, detail="Transaction verification failed.")

    ledger_record = await WalletService.get_wallet_ledger_by_reference(reference, db)

    if not ledger_record:
        raise HTTPException(status_code=404, detail="No ledger entry found.")

    if ledger_record.status == "settled":
        return {"message": "Deposit already processed."}

    # Update ledger entry
    ledger_record.status = "settled"
    ledger_record.gateway = "paystack"
    ledger_record.local_amount = Decimal(result["data"]["amount"]) / 100
    ledger_record.stable_amount = ledger_record.local_amount * Decimal(COOPWISE_USD_NGN_RATE)

    await db.commit()
    await db.refresh(ledger_record)

    await WalletService.deposit_by_reference(reference, db, redis)

    return {"message": "Deposit finalised successfully.", "reference": reference}


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
