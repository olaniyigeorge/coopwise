from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.api.v1.routes.auth import is_admin_permissions
from app.schemas.user import UserRead, UserUpdate
from db.dependencies import get_async_db_session
from app.services.user_service import UserService

router = APIRouter(
    prefix="/api/v1/users", 
    tags=["User Management"]
    )
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

@router.get("/")
async def get_users(
    skip: int = 0, limit: int = 10, 
    # user: AuthenticatedUser = Depends(is_admin_permissions), TODO: Uncomment this line to enforce admin permissions
    db: AsyncSession = Depends(get_async_db_session)
):
    """
        Fetch a list of users with optional pagination.
    """
    # if not user:
    #     raise HTTPException(status_code=401, detail="Invalid login credentials")
    return await UserService.get_users(db, skip=skip, limit=limit)


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: str,
    user_update_data: UserUpdate,
    db: AsyncSession = Depends(get_async_db_session)
):
    """
    Update a user's details by their ID.
    """
    updated_user = await UserService.update_user(db, user_id, user_update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user 

@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: str, 
    # user: AuthenticatedUser = Depends(is_admin_or_owner_permissions), TODO: Uncomment this line to enforce admin permissions
    db: AsyncSession = Depends(get_async_db_session)
):
    """
        Fetch a single user by ID.
    """
    user = await UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


