from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routes.auth import get_current_user, is_admin_or_owner, is_admin_permissions
from app.schemas.auth import AuthenticatedUser
from app.schemas.user import UserDetail, UserUpdate
from db.dependencies import get_async_db_session
from app.services.user_service import UserService

router = APIRouter(
    prefix="/api/v1/users", 
    tags=["User Management"]
    )


@router.get("/me", response_model=UserDetail)
async def get_my_profile(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session)
):
    """
        Fetch a authenticated user.
    """
    user = await UserService.get_user_by_id(db, user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user



@router.get("/")
async def get_users(
    skip: int = 0, limit: int = 10, 
    user: AuthenticatedUser = Depends(is_admin_permissions), 
    db: AsyncSession = Depends(get_async_db_session)
) -> List[UserDetail]:
    """
        Fetch a list of users with optional pagination.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Invalid login credentials")
    return await UserService.get_users(db, skip=skip, limit=limit)


@router.patch("/{user_id}", response_model=UserDetail)
async def update_user(
    user_id: str,
    user_update_data: UserUpdate,
    user: AuthenticatedUser = Depends(is_admin_or_owner), 
    db: AsyncSession = Depends(get_async_db_session)
):
    """
    Update a user's details by their ID.
    """
    updated_user = await UserService.update_user(db, user_id, user_update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user 

@router.get("/{user_id}", response_model=UserDetail)
async def get_user(
    user_id: str, 
    user: AuthenticatedUser = Depends(is_admin_or_owner), # TODO: Uncomment this line to enforce admin permissions
    db: AsyncSession = Depends(get_async_db_session)
):
    """
        Fetch a single user by ID.
    """
    user = await UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

