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
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


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


@router.post("/token", response_model=AuthUser)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
                                 db: AsyncSession = Depends(get_async_db_session)):
    user = await AuthService.authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    token = AuthService.create_access_token({"sub": user.email, "id": str(user.id), "role": user.role.value})

    return {"access_token": token, "user": user}


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
    
