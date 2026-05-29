from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from src.domains.circles.schemas import CoopGroupDetails
from src.domains.circles.schemas import CoopGroupDetails
from src.domains.circles.schemas import CoopGroupDetails

from src.shared.utils.logger import logger
from src.domains.analytics.models import ActivityType
from src.domains.analytics.schemas import ActivityCreate
from src.domains.notifications.schemas import NotificationCreate
from src.domains.analytics.service import ActivityService
from src.domains.circles.service import CooperativeGroupService
from src.domains.notifications.service import NotificationService
from src.domains.users.service import UserService
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.memberships.schemas import MembershipDetails
from src.infra.db.dependencies import get_async_db_session
from src.domains.memberships.service import CooperativeMembershipService
from src.api.middlewares.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/memberships", tags=["Memberships"])


@router.get("/invite", summary="Generate or check out a cooperative invite code")
async def handle_cooperative_invite(
    group_id: UUID = None,
    invite_code: str = None,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    - If `invite_code` is provided: Join a cooperative using the code.
    - If `invite_code` is not provided: Generate a new invite code for the authenticated user.
    """
    if invite_code:
        # Use invite code to join a cooperative
        try:
            resp = await CooperativeMembershipService.checkout_invite_code(
                user=current_user, invite_code=invite_code, db=db
            )
            return resp
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    # No invite_code → generate a new one
    try:
        if not group_id:
            raise HTTPException(
                status_code=400,
                detail="Group ID is required to generate an invite code.",
            )
        logger.info(
            f"\nGenerating invite code for group {group_id} and by user {current_user.id}\n"
        )
        invite_code = await CooperativeMembershipService.generate_invite_code(
            inviter_id=current_user.id, group_id=group_id, db=db
        )
        return {
            "message": "Invite code generated successfully.",
            "invite_code": invite_code,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/accept-invite", response_model=MembershipDetails)
async def accept_invite(
    invite_code: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Accept a cooperative membership invitation using an invite code.
    """
    membership = await CooperativeMembershipService.accept_invite_code(
        db, user, invite_code
    )
    if not membership:
        raise HTTPException(
            status_code=404, detail="Invite not found or already accepted."
        )

    auth_user = await UserService.get_user_by_id(db, user.id)

    if not auth_user:
        raise HTTPException(status_code=404, detail="User not found.")

    group_data = await CooperativeGroupService.get_coop_group_by_id(
        db, membership.group_id
    )

    if not group_data:
        raise HTTPException(status_code=404, detail="Group not found.")

    activity_data = ActivityCreate(
        user_id=user.id,
        type=ActivityType.joined_group.value,
        description=f"{auth_user.full_name} accepted an invite to join the cooperative {group_data.name}",
        group_id=group_data.id,
        entity_id=str(group_data.id),
        amount=None,
    )
    logger.info(f"\nLogging activity... {activity_data}\n")
    await ActivityService.log(db, activity_data)

    noti_data = NotificationCreate(
        user_id=group_data.creator_id,
        title="Invited Request Accepted",
        message=f"{auth_user.full_name} has accepted an invite to join the cooperative {group_data.name}.",
        event_type="group",
        type="info",
        entity_url=str(membership.id),
    )
    await NotificationService.create_and_push_notification_to_user(noti_data, db)

    return membership


@router.get("/", response_model=List[MembershipDetails])
async def list_memberships(
    skip: int = 0,
    limit: int = 10,
    # user: AuthenticatedUser =  Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    List cooperative memberships with optional pagination.
    """
    return await CooperativeMembershipService.list_coop_memberships(
        db,
        # user,
        skip,
        limit,
    )


@router.get("/confirm/{membership_id}")
async def confirm_membership(
    option: str,
    membership_id: int,
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Confirms a membership by flipping its status to accepted.
    """
    membership = await CooperativeMembershipService.confirm_membership(
        option,
        membership_id,
        db,
        user,
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    return membership


@router.get("/{membership_id}", response_model=MembershipDetails)
async def get_membership_by_id(
    membership_id: int,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Retrieve a cooperative membership by ID.
    """
    membership = await CooperativeMembershipService.get_coop_membership_by_id(
        db, user, membership_id
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    return membership


# Admin perms
# @router.patch("/{membership_id}", response_model=MembershipDetails)
# async def update_membership_by_id(
#     membership_id: str,
#     update_data: MembershipUpdate,
#     db: AsyncSession = Depends(get_async_db_session),
#     user=Depends(get_current_user)
# ):
#     """
#     Update a cooperative membership's details. Admin, creator, or the member can perform this.
#     """
#     updated = await CooperativeMembershipService.update_membership(
#         db, membership_id, update_data, user
#     )
#     if not updated:
#         raise HTTPException(status_code=403, detail="Not authorized or membership not found")
#     return updated


@router.delete("/{membership_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_membership_by_id(
    membership_id: int,
    db: AsyncSession = Depends(get_async_db_session),
    user=Depends(get_current_user),
):
    """
    Delete a membership (Admin only).
    """
    deleted = await CooperativeMembershipService.delete_membership(
        db, membership_id, user
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Membership not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/cooperative/{coop_id}/members", response_model=List[MembershipDetails])
async def list_members_by_group(
    coop_id: str,
    filter: str,
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    List all members in a specific cooperative group.
    """
    return await CooperativeMembershipService.get_memberships_by_group(
        coop_id, filter, db
    )
















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