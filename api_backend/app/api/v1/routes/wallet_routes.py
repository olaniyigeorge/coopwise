from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from db.dependencies import get_async_db_session
from app.services.wallet_service import WalletService
from app.schemas.auth import AuthenticatedUser
from app.schemas.wallet_schemas import WalletDeposit, WalletWithdraw, WalletBalance
from app.core.dependencies import get_current_user, get_redis

router = APIRouter(
    prefix="/api/v1/wallet", 
    tags=["Wallet"]
    )

@router.post("/deposit", response_model=WalletBalance)
async def deposit(
    data: WalletDeposit,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis)
):
    return await WalletService.deposit(user, data, db, redis)

@router.post("/withdraw", response_model=WalletBalance)
async def withdraw(
    data: WalletWithdraw,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis)
):
    return await WalletService.withdraw(user, data, db, redis)

@router.get("/balance", response_model=WalletBalance)
async def balance(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
    redis: Redis = Depends(get_redis)
):
    return await WalletService.get_balance(user, db, redis)
