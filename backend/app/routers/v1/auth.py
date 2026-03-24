from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, Optional

from app.schemas.auth import AuthenticatedUser, TokenData
from app.schemas.notifications_schema import NotificationCreate
from app.schemas.user import AuthUser, UserCreate, iAuthWallet
from app.services.notification_service import NotificationService
from db.dependencies import get_async_db_session
from app.services.auth_service import AuthService



# --------------- Auth Middlewares ----------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")



async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> AuthenticatedUser:
    payload = await AuthService.decode_token(token)
    auth_user = AuthenticatedUser(
        id=payload.get("id"), email=payload.get("sub"), role=payload.get("role")
    )
    return auth_user




from fastapi.security.utils import get_authorization_scheme_param

# 👇 1. Define a custom dependency to extract the token safely
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

    return AuthenticatedUser(
        id=UUID(user_id),   
        email=email,
        role=role,
    )


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



# --------------- Auth Routes ----------

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
        {"sub": reg.email, "id": str(reg.id), "role": reg.role.value, "flow_address": reg.flow_address,}
    )
    return {"token": token, "user": reg}


@router.post("/crossmint-sync")
async def crossmint_sync(
    user_wallet_auth_data: iAuthWallet, 
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_async_db_session)
):
    if user is None:
        # No auth'd user, proceed to get wallet and create new user if user_id not on wallet
        print('\n\nNo authenticated user found. Proceeding without user context.\n\n')
    

    synced_data = await AuthService.flow_sync(user_wallet_auth_data, user, db)
    print('\n\nSynced data:', synced_data, "\n\n")

    # Notification is best-effort — never let it block the auth response
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
    user = await AuthService.authenticate_user(
        form_data.username, form_data.password, db
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    token = await AuthService.create_access_token(
        {"sub": user.email, "id": str(user.id), "role": user.role.value, "flow_address": user.flow_address,}
    )

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
            "data": payload,
        }
    except HTTPException as e:
        return {
            "status": "expired",
            "message": "Token expired or invalid. Please request a new reset link.",
            "data": None,
        }


@router.post("/change-password")
async def reset_password(
    token: str, new_password: str, db: AsyncSession = Depends(get_async_db_session)
):
    return await AuthService.change_password(token, new_password, db)

