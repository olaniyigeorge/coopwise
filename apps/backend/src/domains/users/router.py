from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from src.api.middlewares.dependencies import get_current_admin_user, get_current_user, is_admin_or_owner, get_current_admin_user
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.users.schemas import AvatarUploadResponse, UserDetail, UserUpdate
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
    except UserFetchError as e:
        raise HTTPException(status_code=500, detail="Could not fetch users")



ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024  # 5MB

@router.patch("/{user_id}/avatar", response_model=AvatarUploadResponse, status_code=202)
async def update_user_avatar(
    user_id: UUID,
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    print("UPDATE USER ENDPOINT")

    """Queue an avatar upload to Cloudinary. Admin or the user themself."""
    if file.content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    contents = await file.read()
    if len(contents) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 5MB)")

    try:
        task_id = await user_service.queue_avatar_upload(
            user_id=user_id,
            file_bytes=contents,
            filename=file.filename,
            content_type=file.content_type,
        )
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return AvatarUploadResponse(task_id=task_id, status="processing")


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
