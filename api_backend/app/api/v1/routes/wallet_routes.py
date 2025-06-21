from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
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


@router.post(
    "/deposit",
    response_model=WalletDetail,
    summary="Deposit money into your Coopwise account"
)
async def deposit(
    data: WalletDeposit,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis)
):
    # 1. Send user notification about deposit initiation
    noti_data = NotificationCreate(
        user_id=user.id,
        title="Deposit initiated",
        message=f"You have attempted a deposit of {data.currency} {data.local_amount} into your Coopwise wallet.",
        event_type="general_alert",
        type="info",
        entity_url=f"deposit-{user.id}:{data.local_amount}"
    )
    await NotificationService.create_and_push_notification_to_user(noti_data, db)

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
    #     type=LedgerType.DEPOSIT,
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
    updated_wallet = await WalletService.deposit(data, db, user, redis_client)

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
