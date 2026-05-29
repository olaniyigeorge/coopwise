from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from src.domains.auth.schemas import AuthenticatedUser
from src.domains.notifications.schemas import NotificationCreate
from src.domains.users.schemas import AuthUser, UserCreate, iAuthWallet
from src.domains.notifications.service import NotificationService
from src.infra.db.dependencies import get_async_db_session
from src.domains.auth.service import AuthService
from src.api.middlewares.dependencies import (
    get_current_user,
    get_optional_current_user,
    get_current_user_ws,
    is_admin_permissions,
    is_admin_or_owner,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth & Onboarding"])

@router.post("/register")
async def register_user(
    user: UserCreate, db: AsyncSession = Depends(get_async_db_session)
):
    reg = await AuthService.register_user(user, db)
    noti_data = NotificationCreate(
        user_id=reg.id,
        title="Sign up Successful",
        message="Welcome to Coopwise",
        event_type="general_alert",
        type="info",
        entity_url=None,
    )
    await NotificationService.create_and_push_notification_to_user(noti_data, db)
    token = await AuthService.create_access_token(
        {"sub": reg.email, "id": str(reg.id), "role": reg.role.value, "flow_address": reg.flow_address}
    )
    return {"token": token, "user": reg}


@router.post("/crossmint-sync")
async def crossmint_sync(
    user_wallet_auth_data: iAuthWallet,
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_async_db_session)
):
    if user is None:
        print('\n\nNo authenticated user found. Proceeding without user context.\n\n')
    synced_data = await AuthService.flow_sync(user_wallet_auth_data, user, db)
    print('\n\nSynced data:', synced_data, "\n\n")
    try:
        noti_data = NotificationCreate(
            user_id=synced_data["user"]["id"],
            title=f"Wallet {user_wallet_auth_data.flow_address} Successfully Linked To Account",
            message=f"Welcome to Coopwise {synced_data['user']['full_name']}",
            event_type="general_alert",
            type="info",
            entity_url=None,
        )
        await NotificationService.create_and_push_notification_to_user(noti_data, db)
    except Exception as e:
        print(f"\n\n[crossmint-sync] Notification failed (non-fatal): {e}\n\n")
    return synced_data


@router.post("/login", response_model=AuthUser)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_async_db_session),
):
    user = await AuthService.authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    token = await AuthService.create_access_token(
        {"sub": user.email, "id": str(user.id), "role": user.role.value, "flow_address": user.flow_address}
    )
    return {"access_token": token, "user": user}


@router.post("/forgot-password")
async def forgot_password(email: str, db: AsyncSession = Depends(get_async_db_session)):
    return await AuthService.send_reset_password_link(email, db)


@router.get("/confirm-reset-password")
async def confirm_reset_password_token(token: str):
    try:
        payload = await AuthService.confirm_reset_token(token)
        return {"status": "active", "message": "Token is valid. Proceed to reset password.", "data": payload}
    except HTTPException:
        return {"status": "expired", "message": "Token expired or invalid. Please request a new reset link.", "data": None}


@router.post("/change-password")
async def reset_password(
    token: str, new_password: str, db: AsyncSession = Depends(get_async_db_session)
):
    return await AuthService.change_password(token, new_password, db)
