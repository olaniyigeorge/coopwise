from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.schemas.auth import AuthenticatedUser
from app.schemas.user import AuthUser, UserCreate, UserRead, Token
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
    token = AuthService.create_access_token({"sub": reg.email, "id": str(reg.id), "role": reg.role.value})
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


# @router.post("/forgot-password")
# async def forgot_password(email: str):
#     # gt th email
#     # confirm account
#     # create a token user info
#     # build a reset password link
#     # Mail the link to user.email 
#     pass

# @router.get("/confirm-reset-password")
# async def confirm_reset_password_token(token: str):
#     # get the token
#     # parse the token
#     # confirm its not expired
#     # if its expired, return {status: expired, message: request new link, data: null}
#     # if link: return { status: active, message: "Provide a nw password", data: user_data}
#     pass


# @router.post("/change-password")
# async def reset_password(token: str, new_password: str, db: AsyncSession):
#     # get the token
#     # parse the token
#     # confirm its not expired
#     # if its expired, return {status: expired, message: request new link, data: null}
#     # If token active: ...
#     # get user with token.user.id
#     # call; get_password_hash to hash password
#     # update the user acc with the hashed password
#     # return {status: success, message: "Password changed", data: user}
#     pass


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)]
) -> AuthenticatedUser:
    payload = AuthService.decode_token(token)
    
    auth_user = AuthenticatedUser(
        id=payload.get("id"),
        email=payload.get("sub"),
        role=payload.get("role")
    )
    return auth_user

async def is_admin_permissions(
    token: Annotated[str, Depends(oauth2_scheme)],
):
    current_user  = await get_current_user(token)

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
    
