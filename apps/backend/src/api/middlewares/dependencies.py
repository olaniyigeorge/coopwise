"""
Request-scoped FastAPI dependencies: token decoding, current-user resolution,
permission checks, plus a couple of unrelated infra dependencies (Redis,
CashRamp) that lived in this file already.

CHANGED vs the previous version of this file:
  - FIXED BUG: get_current_user called `AuthService.decode_token(token)` as
    if it were a static/class method. decode_token is an instance method on
    AuthService — this call shape would raise a TypeError the moment it was
    actually exercised. It never fired because the only thing pointing at
    it (oauth2_scheme's tokenUrl="/api/v1/auth/login") was the password
    login endpoint, which we've removed entirely.
  - Token decoding now goes straight through a module-level JoseTokenService
    instance instead of through AuthService. AuthService needs a DB session,
    a Crossmint verifier, etc. to construct — none of which token decoding
    actually needs. Decoding OUR platform JWT is a pure function of
    (token, secret, algorithm); routing it through the full service was
    unnecessary coupling.
  - oauth2_scheme's tokenUrl now points at /api/v1/auth/session (the actual
    live auth endpoint) purely for OpenAPI docs' "Authorize" button UX —
    FastAPI doesn't otherwise use this value to decode anything.
"""
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
from src.domains.auth.exceptions import InvalidTokenError, TokenExpiredError
from src.domains.auth.infra.jose_token_service import JoseTokenService
from src.domains.auth.schemas import AuthenticatedUser

# ---------------------------- 🔁 Redis Dependency ----------------------------
redis_client: Redis = redis_async.from_url(config.REDIS_URL)

async def get_redis() -> Redis:
    return redis_client

# ---------------------------- 💳 CashRamp Service Dependency ----------------------------
def get_cashramp_service(redis: Redis = Depends(get_redis)) -> CashRampService:
    return CashRampService(redis=redis)

# ---------------------------- 👤 Auth Dependencies ----------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/session", auto_error=False)

_token_service = JoseTokenService(config.APP_SECRET_KEY, config.ALGORITHM)


def _decode_platform_token(token: str) -> dict:
    """Decodes OUR platform JWT only — never a Crossmint JWT. Raises
    InvalidTokenError / TokenExpiredError (domain exceptions) on failure;
    callers below translate those into HTTP responses."""
    return _token_service.decode(token)


async def get_current_user(
    token: Annotated[Optional[str], Depends(oauth2_scheme)],
) -> AuthenticatedUser:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = _decode_platform_token(token)
    except TokenExpiredError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = payload.get("id")
    role = payload.get("role")
    if not user_id or not role:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return AuthenticatedUser(id=UUID(user_id), email=payload.get("sub"), role=role)

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
    except HTTPException:
        return None

async def get_current_user_ws(websocket: WebSocket) -> AuthenticatedUser:
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")
    try:
        payload = _decode_platform_token(token)
    except (TokenExpiredError, InvalidTokenError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("id")
    role = payload.get("role")
    if not user_id or not role:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return AuthenticatedUser(id=UUID(user_id), email=payload.get("sub"), role=role)

async def is_admin_permissions(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

async def is_admin_or_owner(
    resource_owner_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    if current_user.role.value == "admin" or current_user.id == resource_owner_id:
        return current_user
    raise HTTPException(status_code=403, detail="Not authorized")

user_dependency = Depends(get_current_user)
admin_or_owner_dependency = Depends(is_admin_or_owner)

# ---------------------------- 🧠 Database Session Dependency ----------------------------
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with db_manager.get_session() as session:
        yield session