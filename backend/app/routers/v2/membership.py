

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.services import flow_service
from app.utils.logger import logger

from app.schemas.cooperative_group import CoopGroupDetails, CooperativeStatus
from app.schemas.activity_schemas import ActivityCreate
from app.schemas.notifications_schema import NotificationCreate
from app.schemas.auth import AuthenticatedUser
from app.schemas.cooperative_membership import MembershipCreate, MembershipDetails

from app.services.activity_service import ActivityService
from app.services.cooperative_group_service import CooperativeGroupService
from app.services.notification_service import NotificationService
from app.services.user_service import UserService
from app.services.membership_service import CooperativeMembershipService

from db.models.activity_model import ActivityType

from db.dependencies import get_async_db_session
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/memberships", tags=["Memberships"])


@router.post("/{circle_id}/join", response_model=CoopGroupDetails)
async def join_circle(
    circle_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    # 1. Fetch the circle
    circle = await CooperativeGroupService.get_coop_group_by_id(db, circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")

    if circle.is_complete:
        raise HTTPException(status_code=400, detail="This circle has already completed")

    if circle.status == CooperativeStatus.inactive:
        raise HTTPException(status_code=400, detail="This circle is no longer active")

    # 2. Check if already a member
    existing = await CooperativeMembershipService.get_membership_by_user_and_group(
        user_id=user.id, group_id=UUID(circle_id), db=db
    )
    if existing and existing.status == "accepted":
        raise HTTPException(status_code=400, detail="You are already a member of this circle")

    # 3. Check capacity
    if circle.member_count >= circle.max_members:
        raise HTTPException(status_code=400, detail="This circle is full")

    # 4. Submit to Flow
    tx_id = None
    try:
        tx_id = await flow_service.join_circle(
            circle_id=circle.chain_circle_id,
            member_address=user.flow_address or "",
        )
    except Exception as e:
        logger.warning(f"Flow join tx failed (non-fatal for now): {e}")

    # 5. Create or update membership
    membership_data = MembershipCreate(
        user_id=user.id,
        group_id=UUID(circle_id),
        invited_by=circle.creator_id,
        role="member",
        status="accepted",
        queue_position=circle.member_count + 1,  # next in queue
    )
    await CooperativeMembershipService.create_membership(db, membership_data, user)

    # 6. Activity log
    try:
        await ActivityService.log(db, ActivityCreate(
            user_id=user.id,
            type=ActivityType.joined_group.value,
            description=f"You joined circle: {circle.name}",
            group_id=UUID(circle_id),
            entity_id=circle_id,
            amount=None,
        ))
    except Exception as e:
        logger.warning(f"Activity log failed (non-fatal): {e}")

    # 7. Notify circle creator
    try:
        notification_data = NotificationCreate(
                user_id=circle.creator_id,
                title="New Member Joined",
                message=f"{user.email} joined your circle '{circle.name}'.",
                event_type="group",
                type="info",
                entity_url=f"/circle/{circle_id}",
            )
        await NotificationService.create_and_push_notification_to_user(
            notification_data,
            db,
        )
    except Exception as e:
        logger.warning(f"Notification failed (non-fatal): {e}")

    # Return updated circle with new member count
    updated = await CooperativeGroupService.get_coop_group_by_id(
        db, circle_id, requesting_user_id=str(user.id)
    )
    return updated