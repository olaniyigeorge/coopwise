from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, WebSocket
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.schemas.auth import AuthenticatedUser
from app.schemas.notifications_schema import NotificationCreate
from app.schemas.user import AuthUser, UserCreate
from app.services.notification_service import NotificationService
from db.dependencies import get_async_db_session
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/api/v1/auth", 
    tags=["Auth & Onboarding"]
    )
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@router.post("/register")
async def register_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_async_db_session)
):
    reg = await AuthService.register_user(user, db)

    noti_data = NotificationCreate(
        user_id = reg.id,
        title = "Sign up Successful",
        message = "Welcome to Coopwise",
        event_type = "general_alert",
        type = "info",
        entity_url = None
    )
    await NotificationService.create_and_push_notification_to_user(
        noti_data, db
    )
    token = await AuthService.create_access_token({"sub": reg.email, "id": str(reg.id), "role": reg.role.value})
    return {
        "token": token,
        "user": reg
    }


@router.post("/login", response_model=AuthUser)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
                                 db: AsyncSession = Depends(get_async_db_session)):
    user = await AuthService.authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    token = await AuthService.create_access_token({"sub": user.email, "id": str(user.id), "role": user.role.value})

    return {"access_token": token, "user": user}


@router.post("/forgot-password")
async def forgot_password(email: str, db: AsyncSession = Depends(get_async_db_session)):
    return await AuthService.send_reset_password_link(email, db)


@router.get("/confirm-reset-password")
async def confirm_reset_password_token(token: str):
    try:
        payload = await AuthService.confirm_reset_token(token)
        return {
            "status": "active",
            "message": "Token is valid. Proceed to reset password.",
            "data": payload
        }
    except HTTPException as e:
        return {
            "status": "expired",
            "message": "Token expired or invalid. Please request a new reset link.",
            "data": None
        }


@router.post("/change-password")
async def reset_password(
    token: str,
    new_password: str,
    db: AsyncSession = Depends(get_async_db_session)
):
    return await AuthService.change_password(token, new_password, db)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)]
) -> AuthenticatedUser:
    payload = await AuthService.decode_token(token)
    auth_user = AuthenticatedUser(
        id=payload.get("id"),
        email=payload.get("sub"),
        role=payload.get("role")
    )
    return auth_user


async def get_current_user_ws(websocket: WebSocket) -> AuthenticatedUser:
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    payload = await AuthService.decode_token(token)
    auth_user = AuthenticatedUser(
        id=payload.get("id"),
        email=payload.get("sub"),
        role=payload.get("role")
    )
    return auth_user


async def is_admin_permissions(
    token: Annotated[str, Depends(oauth2_scheme)],
):
    payload = await AuthService.decode_token(token)
    current_user = AuthenticatedUser(
        id=payload.get("id"),
        email=payload.get("sub"),
        role=payload.get("role")
    )

    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

async def is_admin_or_owner(
    token: Annotated[str, Depends(oauth2_scheme)],
    resource_owner_id: UUID
):
    current_user  = await get_current_user(token)
    
    if current_user.role.value == "admin" or current_user.id == resource_owner_id:
        return current_user

    raise HTTPException(status_code=403, detail="Not authorized")
    