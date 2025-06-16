from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.v1.routes.auth import get_current_user
from app.schemas.activity_schemas import ActivityCreate
from app.schemas.auth import AuthenticatedUser
from app.schemas.cooperative_group import CoopGroupCreate, CoopGroupDetails, CoopGroupUpdate
from app.schemas.cooperative_membership import MembershipCreate
from app.schemas.dashboard_schema import ActivityType
from app.schemas.notifications_schema import NotificationCreate
from app.services.activity_service import ActivityService
from app.services.notification_service import NotificationService
from db.dependencies import get_async_db_session
from app.services.cooperative_group_service import CooperativeGroupService
from app.services.membership_service import CooperativeMembershipService


router = APIRouter(
    prefix="/api/v1/cooperatives", 
    tags=["Cooperative Groups"]
    )


@router.post("/create", response_model=CoopGroupDetails, status_code=status.HTTP_201_CREATED)
async def create_cooperative_group(
    coop_data: CoopGroupCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session)
):
    coop = await CooperativeGroupService.create_coop(coop_data, db)

    membership_data =  MembershipCreate(
        user_id=user.id,
        group_id=coop.id,
        invited_by=user.id,
        role="admin",
        status="accepted"
    )
    
    await CooperativeMembershipService.create_membership(
        db,
        membership_data,
        user
    )

    activity_data =  ActivityCreate(
        user_id=coop.creator_id,
        type=ActivityType.CREATED_GROUP.value,
        description=f"You created a group",
        group_id=coop.id,
        entity_id=str(coop.id), 
        amount=None
    )
    print(f"\Logging activity... {membership_data}\n")
    await ActivityService.log(
        db,
        activity_data
    )
    
    noti_data = NotificationCreate(
        user_id = user.id,
        title = "New Cooperative Created",
        message = f"Your cooperative, {coop.name} was created successful",
        event_type = "group",
        type = "success",
        entity_url = None
    )
    await NotificationService.create_and_push_notification_to_user(
        noti_data, db
    )

    return CoopGroupDetails.model_validate(coop)


@router.get("/", response_model=List[CoopGroupDetails])
async def list_cooperative_groups(
        db: AsyncSession = Depends(get_async_db_session), 
        skip: int = 0, limit: int = 10
    ):
    """
        Fetch a list of cooperative groups with optional pagination.
    """

    return await CooperativeGroupService.get_coop_groups(
        db, skip=skip, limit=limit)
    
@router.get("/me", response_model=List[CoopGroupDetails])
async def list_cooperative_groups(
        db: AsyncSession = Depends(get_async_db_session), 
        skip: int = 0, limit: int = 10
    ):
    """
        Fetch a list of cooperative groups with optional pagination.
    """

    return await CooperativeGroupService.get_coop_groups(
        db, skip=skip, limit=limit)


@router.get("/{coop_id}", response_model=CoopGroupDetails)
async def get_coop(coop_id: str, db: AsyncSession = Depends(get_async_db_session)):
    """
        Fetch a single cooperative group by ID.
    """
    coop_group = await CooperativeGroupService.get_coop_group_by_id(db, coop_id)
    if not coop_group:
        raise HTTPException(status_code=404, detail="Cooperative group not found")
    return coop_group


@router.get("/ext/{coop_id}")
async def get_extended_coop(coop_id: str, db: AsyncSession = Depends(get_async_db_session)):
    """
        Get extended data about a cooperative group by ID.
    """
    coop_group = await CooperativeGroupService.get_ext_coop_group_by_id(db, coop_id)
    if not coop_group:
        raise HTTPException(status_code=404, detail="Cooperative group not found")
    return coop_group


@router.patch("/{coop_id}", response_model=CoopGroupDetails)
async def update_coop(
    coop_id: str,
    coop_update_data: CoopGroupUpdate,
    db: AsyncSession = Depends(get_async_db_session)
):
    """
    Update a cooperative group's details by its ID.
    """
    updated_coop = await CooperativeGroupService.update_coop(db, coop_id, coop_update_data)
    if not updated_coop:
        raise HTTPException(status_code=404, detail="Cooperative group not found")
    return updated_coop


@router.delete("/{coop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coop(
    coop_id: str,
    db: AsyncSession = Depends(get_async_db_session)
):
    """
    Delete a cooperative group by its ID.
    Returns 204 No Content if successful.
    """
    deleted_coop = await CooperativeGroupService.delete_coop(db, coop_id)
    if not deleted_coop:
        raise HTTPException(status_code=404, detail="Cooperative group not found")
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)