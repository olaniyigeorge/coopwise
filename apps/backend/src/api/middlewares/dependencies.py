from uuid import UUID
from typing import Annotated, AsyncGenerator, Optional

from fastapi import Depends, HTTPException, Request, WebSocket
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.utils import get_authorization_scheme_param
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis_async
from redis.asyncio.client import Redis

from config import AppConfig as config
from src.infra.db.database import db_manager
from src.infra.payments.cashramp_service import CashRampService
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.auth.service import AuthService

# ---------------------------- 🔁 Redis Dependency ----------------------------
redis_client: Redis = redis_async.from_url(config.REDIS_URL)

async def get_redis() -> Redis:
    return redis_client

# ---------------------------- 💳 CashRamp Service Dependency ----------------------------
def get_cashramp_service(redis: Redis = Depends(get_redis)) -> CashRampService:
    return CashRampService(redis=redis)

# ---------------------------- 👤 Auth Dependencies ----------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> AuthenticatedUser:
    payload = await AuthService.decode_token(token)
    return AuthenticatedUser(
        id=payload.get("id"), email=payload.get("sub"), role=payload.get("role")
    )

async def get_token_optional(request: Request) -> Optional[str]:
    authorization: str = request.headers.get("Authorization")
    if not authorization:
        return None
    scheme, token = get_authorization_scheme_param(authorization)
    if scheme.lower() != "bearer":
        return None
    return token

async def get_optional_current_user(
    token: Optional[str] = Depends(get_token_optional),
) -> Optional[AuthenticatedUser]:
    if not token:
        return None
    try:
        return await get_current_user(token)
    except Exception:
        return None

async def get_current_user_ws(websocket: WebSocket) -> AuthenticatedUser:
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")
    payload = await AuthService.decode_token(token)
    user_id = payload.get("id")
    email = payload.get("sub")
    role = payload.get("role")
    if not user_id or not email or not role:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return AuthenticatedUser(id=UUID(user_id), email=email, role=role)

async def is_admin_permissions(
    token: Annotated[str, Depends(oauth2_scheme)],
):
    payload = await AuthService.decode_token(token)
    current_user = AuthenticatedUser(
        id=payload.get("id"), email=payload.get("sub"), role=payload.get("role")
    )
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

async def is_admin_or_owner(
    token: Annotated[str, Depends(oauth2_scheme)], resource_owner_id: UUID
):
    current_user = await get_current_user(token)
    if current_user.role.value == "admin" or current_user.id == resource_owner_id:
        return current_user
    raise HTTPException(status_code=403, detail="Not authorized")

user_dependency = Depends(get_current_user)
admin_or_owner_dependency = Depends(is_admin_or_owner)

# ---------------------------- 🧠 Database Session Dependency ----------------------------
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with db_manager.get_session() as session:
        yield session
