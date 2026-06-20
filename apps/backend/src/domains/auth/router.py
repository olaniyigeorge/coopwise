from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

# NOTE: get_current_user / get_current_user_ws / is_admin_permissions /
# is_admin_or_owner are not used directly in this file, but other domains
# (e.g. users.router) import them FROM here rather than from
# src.api.middlewares.dependencies directly. Keep this import even though
# this file doesn't call them itself, or those domains break on startup.
from src.api.middlewares.dependencies import (
    get_current_user,
    get_current_user_ws,
    get_optional_current_user,
    is_admin_or_owner,
    is_admin_permissions,
)
from src.domains.auth.dependencies import get_auth_service
from src.domains.auth.exceptions import (
    EmailAlreadyRegisteredError,
    InvalidTokenError,
    InvalidTokenTypeError,
    PhoneNumberAlreadyRegisteredError,
    TokenExpiredError,
    UserCreationError,
    UserNotFoundError,
    UsernameAlreadyRegisteredError,
)
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.auth.service import AuthService
from src.domains.users.schemas import AuthUser, UserCreate, iAuthWallet
from src.infra.db.dependencies import get_async_db_session

router = APIRouter(prefix="/api/v1/auth", tags=["Auth & Onboarding"])


@router.post("/register")
async def register_user(
    user: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        reg = await auth_service.register_user(user)
    except (
        EmailAlreadyRegisteredError,
        UsernameAlreadyRegisteredError,
        PhoneNumberAlreadyRegisteredError,
    ) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except UserCreationError as e:
        raise HTTPException(status_code=400, detail=f"Could not create user - {e.reason}")

    token = await auth_service.create_access_token(
        {"sub": reg.email, "id": str(reg.id), "role": reg.role.value, "flow_address": reg.flow_address}
    )
    return {"token": token, "user": reg}


@router.post("/crossmint-sync")
async def crossmint_sync(
    user_wallet_auth_data: iAuthWallet,
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    synced_data = await auth_service.flow_sync(user_wallet_auth_data, user)
    return synced_data


@router.post("/login", response_model=AuthUser)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    auth_service: AuthService = Depends(get_auth_service),
):
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    token = await auth_service.create_access_token(
        {"sub": user.email, "id": str(user.id), "role": user.role.value, "flow_address": user.flow_address}
    )
    return {"access_token": token, "user": user}


@router.post("/forgot-password")
async def forgot_password(
    email: str,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        return await auth_service.send_reset_password_link(email)
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/confirm-reset-password")
async def confirm_reset_password_token(
    token: str,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        payload = await auth_service.confirm_reset_token(token)
        return {"status": "active", "message": "Token is valid. Proceed to reset password.", "data": payload}
    except (InvalidTokenError, InvalidTokenTypeError, TokenExpiredError):
        return {"status": "expired", "message": "Token expired or invalid. Please request a new reset link.", "data": None}


@router.post("/change-password")
async def reset_password(
    token: str,
    new_password: str,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        return await auth_service.change_password(token, new_password)
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (InvalidTokenError, InvalidTokenTypeError, TokenExpiredError) as e:
        raise HTTPException(status_code=401, detail=str(e))
