from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from src.api.middlewares.dependencies import (
    get_current_user,
    is_admin_or_owner,
    get_current_admin_user,
)
from src.domains.auth.schemas import AuthenticatedUser
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.users.public_profile import get_public_profile
from src.domains.users.schemas import (
    AvatarUploadResponse,
    PublicProfile,
    UserDetail,
    UserUpdate,
)
from src.infra.db.dependencies import get_async_db_session
from src.domains.users.service import UserService
from src.domains.users.dependencies import get_user_service
from src.domains.users.exceptions import (
    UserConflictError,
    UserFetchError,
    UserNotFoundError,
    UserUpdateError,
)

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


@router.get("/{user_id}/public", response_model=PublicProfile)
async def get_public_profile_route(
    user_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """Limited profile of any member, visible to any signed-in user."""
    try:
        return await get_public_profile(db, user_id)
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/")
async def get_users(
    skip: int = 0,
    limit: int = 10,
    user: AuthenticatedUser = Depends(get_current_admin_user),
    user_service: UserService = Depends(get_user_service),
) -> List[UserDetail]:
    """Fetch a list of users with optional pagination. Admin only."""
    # NOTE: the old "if not user: raise 401" check here was dead code —
    # get_current_admin_user already raises on failure before this body runs.
    try:
        return await user_service.get_users(skip=skip, limit=limit)
    except UserFetchError:
        raise HTTPException(status_code=500, detail="Could not fetch users")


ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024  # 5MB


@router.patch("/{user_id}/avatar", response_model=AvatarUploadResponse)
async def update_user_avatar(
    user_id: UUID,
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    """Save a new profile photo. Admin or the user themself."""
    if file.content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(status_code=415, detail="Use a JPEG, PNG, or WebP image")

    contents = await file.read()
    if len(contents) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 5MB)")

    try:
        url = await user_service.upload_avatar(
            user_id=user_id,
            file_bytes=contents,
            content_type=file.content_type or "image/jpeg",
        )
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except UserUpdateError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return AvatarUploadResponse(profile_picture_url=url)


@router.patch("/{user_id}", response_model=UserDetail)
async def update_user(
    user_id: UUID,
    user_update_data: UserUpdate,
    user: AuthenticatedUser = Depends(is_admin_or_owner),
    user_service: UserService = Depends(get_user_service),
):
    """Update a user's details by their ID. Admin or the user themself.

    Also used for onboarding: after signup + signin, the client PATCHes
    this endpoint to fill in savings preferences.
    """
    try:
        return await user_service.update_user(user_id, user_update_data)
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except UserConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except UserUpdateError:
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
