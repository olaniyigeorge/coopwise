from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.schemas.user import UserCreate, UserRead, Token
from db.dependencies import get_async_db_session
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/api/v1/auth", 
    tags=["auth"]
    )
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


@router.post("/register", response_model=UserRead)
async def register_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_async_db_session)
):
    return await AuthService.register_user(user, db)


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
                                 db: AsyncSession = Depends(get_async_db_session) ):
    user = await AuthService.authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    
    token = AuthService.create_access_token({"sub": user.email, "id": user.id})
    return {"access_token": token, "token_type": "Bearer"}


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)]
):
    payload = AuthService.decode_token(token)
    return {"id": payload.get("id"), "email": payload.get("sub")}
