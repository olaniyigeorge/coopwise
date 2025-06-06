from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from db.dependencies import get_async_db_session
from app.services.wallet_service import WalletService
from app.schemas.auth import AuthenticatedUser
from app.schemas.wallet_schemas import WalletDeposit, WalletWithdraw, WalletBalance, WalletDetail
from app.core.dependencies import get_current_user, get_redis

router = APIRouter(
    prefix="/api/v1/wallet", 
    tags=["Wallet"]
    )

@router.post("/deposit", response_model=WalletDetail, summary="Deposit money into your coopwise account")
async def deposit(
    data: WalletDeposit,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis: Redis = Depends(get_redis)
):
    return await WalletService.deposit(data, db, user, redis)

@router.get("/get-wallet", response_model=WalletDetail)
async def get_wallet(
    db: AsyncSession = Depends(get_async_db_session), 
    user: AuthenticatedUser = Depends(get_current_user),
    redis: Redis = Depends(get_redis)
    ):

    return await WalletService.get_wallet(db, user, redis)

@router.post("/withdraw")
async def withdraw(
    data: WalletWithdraw,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    redis: Redis = Depends(get_redis)
):
    return await WalletService.withdraw(data, db, user, redis)
