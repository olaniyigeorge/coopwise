from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession


from src.api.middlewares.dependencies import get_current_user, is_admin_or_owner, is_admin_permissions
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.users.dependencies import get_user_service
from src.domains.users.exceptions import (
    UserFetchError,
    UserNotFoundError,
    UserUpdateError,
)
from src.domains.users.schemas import UserDetail, UserUpdate
from src.domains.users.service import UserService

router = APIRouter(prefix="/api/v1/users", tags=["User Management"])


@router.get("/me", response_model=UserDetail)
async def get_my_profile(
    user: AuthenticatedUser = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Fetch the authenticated user's own profile."""
    try:
        return await user_service.get_user_by_id(user.id)
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/")
async def get_users(
    skip: int = 0,
    limit: int = 10,
    user: AuthenticatedUser = Depends(is_admin_permissions),
    user_service: UserService = Depends(get_user_service),
) -> List[UserDetail]:
    """Fetch a list of users with optional pagination. Admin only."""
    # NOTE: the old "if not user: raise 401" check here was dead code —
    # is_admin_permissions already raises on failure before this body runs.
    try:
        return await user_service.get_users(skip=skip, limit=limit)
    except UserFetchError as e:
        raise HTTPException(status_code=500, detail="Could not fetch users")


@router.patch("/{user_id}", response_model=UserDetail)
async def update_user(
    user_id: UUID,
    user_update_data: UserUpdate,
    user: AuthenticatedUser = Depends(is_admin_or_owner),
    user_service: UserService = Depends(get_user_service),
):
    """Update a user's details by their ID. Admin or the user themself."""
    try:
        return await user_service.update_user(user_id, user_update_data)
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except UserUpdateError as e:
        raise HTTPException(status_code=500, detail="Could not update user")


@router.get("/{user_id}", response_model=UserDetail)
async def get_user(
    user_id: UUID,
    user: AuthenticatedUser = Depends(is_admin_or_owner),
    user_service: UserService = Depends(get_user_service),
):
    """Fetch a single user by ID. Admin or the user themself."""
    try:
        return await user_service.get_user_by_id(user_id)
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
