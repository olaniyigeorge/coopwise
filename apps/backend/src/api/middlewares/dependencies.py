"""
Request-scoped FastAPI dependencies: token decoding, current-user resolution,
permission checks, plus infra dependencies (Redis, CashRamp).

Changes:
  - Token decoding uses a module-level JoseTokenService instance directly.
  - Removed AuthService coupling from token validation.
  - HTTPBearer is used for JWT authentication.
  - HTTPBearer credentials are normalized into raw JWT strings before decoding.
"""

from uuid import UUID
from typing import Annotated, AsyncGenerator, Optional

from fastapi import Depends, HTTPException, Request, WebSocket
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.security.utils import get_authorization_scheme_param

from sqlalchemy.ext.asyncio import AsyncSession

from config import AppConfig as config

from src.infra.db.database import db_manager

from src.domains.auth.exceptions import (
    InvalidTokenError,
    TokenExpiredError,
)

from src.domains.auth.infra.jose_token_service import JoseTokenService
from src.domains.auth.schemas import AuthenticatedUser



# ---------------------------- 👤 Auth Dependencies ----------------------------

oauth2_scheme = HTTPBearer(auto_error=False)

_token_service = JoseTokenService(
    config.APP_SECRET_KEY,
    config.ALGORITHM,
)


def _decode_platform_token(token: str) -> dict:
    """
    Decode OUR platform JWT only.

    Raises:
        TokenExpiredError
        InvalidTokenError
    """
    return _token_service.decode(token)


async def get_current_user(
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials],
        Depends(oauth2_scheme),
    ],
) -> AuthenticatedUser:
    """
    Resolve authenticated user from Bearer JWT.
    """

    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    token = credentials.credentials

    try:
        payload = _decode_platform_token(token)

    except TokenExpiredError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired",
        )

    except InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )

    user_id = payload.get("id")
    role = payload.get("role")

    if not user_id or not role:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload",
        )

    return AuthenticatedUser(
        id=UUID(user_id),
        email=payload.get("sub"),
        role=role,
    )


async def get_token_optional(
    request: Request,
) -> Optional[str]:
    """
    Extract bearer token manually for optional authentication routes.
    """

    authorization = request.headers.get("Authorization")

    if not authorization:
        return None

    scheme, token = get_authorization_scheme_param(
        authorization
    )

    if scheme.lower() != "bearer":
        return None

    return token


async def get_optional_current_user(
    token: Optional[str] = Depends(get_token_optional),
) -> Optional[AuthenticatedUser]:
    """
    Return current user if token exists and is valid.
    Otherwise return None.
    """

    if not token:
        return None

    try:
        payload = _decode_platform_token(token)

    except (TokenExpiredError, InvalidTokenError):
        return None

    user_id = payload.get("id")
    role = payload.get("role")

    if not user_id or not role:
        return None

    return AuthenticatedUser(
        id=UUID(user_id),
        email=payload.get("sub"),
        role=role,
    )


async def get_current_user_ws(
    websocket: WebSocket,
) -> AuthenticatedUser:
    """
    Authenticate websocket connections using query token.
    """

    token = websocket.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=400,
            detail="Missing token",
        )

    try:
        payload = _decode_platform_token(token)

    except (TokenExpiredError, InvalidTokenError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    user_id = payload.get("id")
    role = payload.get("role")

    if not user_id or not role:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload",
        )

    return AuthenticatedUser(
        id=UUID(user_id),
        email=payload.get("sub"),
        role=role,
    )

# TODO: Consider a new of this with different admin priviledges eg per group
async def get_current_admin_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:

    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not authorized",
        )

    return current_user

# This doesn't work the way i want it yet
def is_admin_or_owner(path_param: str = "user_id"):
    async def _dependency(
        request: Request,
        current_user: AuthenticatedUser = Depends(get_current_user),
    ) -> AuthenticatedUser:
        resource_owner_id = UUID(request.path_params[path_param])
        if current_user.role.value == "admin" or current_user.id == resource_owner_id:
            return current_user
        raise HTTPException(status_code=403, detail="Not authorized")
    return _dependency


user_dependency = Depends(get_current_user)

admin_or_owner_dependency = Depends(
    is_admin_or_owner
)


# ---------------------------- 🧠 Database Session Dependency ----------------------------

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with db_manager.get_session() as session:
        yield session