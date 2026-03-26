from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List


from app.schemas.contribution_schemas import CircleHistoryEntry
from db.models.activity_model import ActivityType
from app.routers.v1.auth import get_current_user
from app.utils.logger import logger
from config import AppConfig
from app.schemas.activity_schemas import ActivityCreate
from app.schemas.auth import AuthenticatedUser
from app.schemas.cooperative_group import (
    CoopGroupCreate,
    CoopGroupDetails,
    CoopGroupUpdate,
    JoinCircleResponse,
    CooperativeStatus
)

from app.schemas.cooperative_membership import CircleMemberDetail, MembershipCreate
from app.schemas.notifications_schema import NotificationCreate
from app.services.activity_service import ActivityService
from app.services.notification_service import NotificationService
from db.dependencies import get_async_db_session
from app.services.cooperative_group_service import CooperativeGroupService
from app.services.membership_service import CooperativeMembershipService

# from app.services.chain import w3, poolfactory, from_account, PRIVATE_KEY

from app.services.flow_service import flow_service
from app.services.fx_service import fx_service
from db.models.membership import GroupMembership


router = APIRouter(prefix="/api/v1/cooperatives", tags=["Cooperative Groups"])

@router.post("/create", response_model=CoopGroupDetails, status_code=status.HTTP_201_CREATED)
async def create_cooperative_group(
    coop_data: CoopGroupCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    # 1. Resolve phone numbers → Flow addresses
    # TODO: real lookup once user phone is indexed
    # member_addresses = await resolve_member_addresses(db, coop_data.member_phones)
    member_addresses = [user.flow_address] if user.flow_address else []

    # 2. Convert local currency → USDC
    usdc_amount = await fx_service.to_usdc(
        coop_data.contribution_amount, coop_data.currency
    )

    print(f"\nAmount in USDC: {usdc_amount} \n")

    # 3. Write to Postgres first with status=pending, chain_circle_id=None
    #    So a Flow failure doesn't lose the user's data
    pending_data = coop_data.model_copy(update={
        "creator_id": user.id,
        "chain_circle_id": None,        # filled in after Flow confirms
        "weekly_amount_usdc": usdc_amount,
        "status": CooperativeStatus.pending.value,
        "current_round": 0,
        "is_complete": False,
    })
    coop = await CooperativeGroupService.create_coop(pending_data, db)

    # 4. Submit to Flow blockchain
    try:
        tx_id = await flow_service.create_circle(
            member_addresses=member_addresses,
            weekly_amount_usdc=usdc_amount,
            rotation_order=coop_data.rotation_order,
        )
        chain_circle_id = await flow_service.await_circle_created_event(tx_id)

        print(f"\ tx_id: {tx_id} \n chain_circle_id: {chain_circle_id} \n")

        # Update record with chain data
        coop.chain_circle_id = chain_circle_id
        coop.status = CooperativeStatus.active.value
        await db.commit()
        await db.refresh(coop)
    except Exception as e:
        logger.error(f"Flow tx failed for circle {coop.id}: {e}")
        # Circle stays in DB with status=pending — can be retried
        # Don't raise — return the pending circle to the user

    # 5. Add creator membership
    membership_data = MembershipCreate(
        user_id=user.id,
        group_id=coop.id,
        invited_by=user.id,
        role="admin",
        status="accepted",
        payout_position=1 if coop_data.rotation_order == "sequential" else None,
    )
    await CooperativeMembershipService.create_membership(db, membership_data, user)

    # 6. Activity log
    activity_data = ActivityCreate(
        user_id=coop.creator_id,
        type=ActivityType.created_group.value,
        description=f"You created a group: {coop.name}",
        group_id=coop.id,
        entity_id=str(coop.id),
        amount=None,
    )
    await ActivityService.log(db, activity_data)

    # 7. Notification
    try:
        noti_data = NotificationCreate(
            user_id=user.id,
            title="New Circle Created",
            message=f"Your circle '{coop.name}' was successfully created on Flow.",
            event_type="group",
            type="success",
            entity_url=f"/circle/{coop.id}",
        )
        await NotificationService.create_and_push_notification_to_user(noti_data, db)
    except Exception as e:
        logger.warning(f"Notification failed (non-fatal): {e}")

    # TODO: Send invite notifications to coop_data.member_phones

    return CoopGroupDetails.model_validate(coop)

@router.post("/{coop_id}/join", response_model=JoinCircleResponse, status_code=status.HTTP_200_OK)
async def join_circle(
    coop_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session)
):
    # Fetch group to get chain_circle_id
    coop_group = await CooperativeGroupService.get_coop_group_by_id(db, str(coop_id))
    if not coop_group:
        raise HTTPException(status_code=404, detail="Circle not found")

    # 1. Submit JoinCircle.cdc transaction to Flow (Stubbed)
    # tx_id = await flow_service.join_circle(
    #     circle_id=coop_group.chain_circle_id,
    #     member_address=user.flow_address
    # )
    tx_id = "0xMockFlowTransactionId12345"

    # 2. Update Postgres membership record
    membership_data = MembershipCreate(
        user_id=user.id,
        group_id=coop_group.id,
        invited_by=coop_group.creator_id,
        role="member",
        status="accepted"
    )
    await CooperativeMembershipService.create_membership(db, membership_data, user)

    return {"tx_id": tx_id, "status": "joined", "message": "Successfully joined the circle on-chain."}








@router.post("/{circle_id}/invite")
async def generate_circle_invite(
    circle_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    # 1. Confirm circle exists
    circle = await CooperativeGroupService.get_coop_group_by_id(db, circle_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")

    # 2. Confirm caller is an accepted member
    membership = await CooperativeMembershipService.get_membership_by_user_and_group(
        user_id=user.id, group_id=UUID(circle_id), db=db
    )

    if not membership or membership.status.value != "accepted":
        raise HTTPException(
            status_code=403,
            detail="Only accepted members can generate invite links",
        )

    # 3. Generate the code
    invite_code = await CooperativeMembershipService.generate_invite_code(
        db=db,
        group_id=UUID(circle_id),
        inviter_id=user.id,
    )

    base_url = AppConfig.CLIENT_DOMAIN  # e.g. "https://coopwise.app" or "http://localhost:3000"
    invite_link = f"{base_url}/invite/{invite_code}"

    return {
        "invite_code": invite_code,
        "invite_link": invite_link,
    }


@router.get("/{invite_code}/invite", response_model=CoopGroupDetails)
async def get_circle_by_invite_code(
    invite_code: str,
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Public endpoint — no auth required.
    Decodes the invite code to extract group_id, returns public circle preview.
    Code format: CPW-INV-{inviter_id}:{group_id}
    """
    try:
        # Strip the prefix (INVITE_CODE_PREFIX = "CPW-INV-")
        print(f"\n\n {invite_code} \n\n")
        stripped = invite_code.replace(AppConfig.INVITE_CODE_PREFIX, "", 1)
        inviter, group_id_str = stripped.split(":")
        print(f"\n\n {inviter} \n {group_id_str} \n\n")
        group_id = UUID(group_id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid invite code format")

    circle = await CooperativeGroupService.get_coop_group_by_id(db, str(group_id))
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")

    return circle








@router.get("/", response_model=List[CoopGroupDetails])
async def list_cooperative_groups(
    db: AsyncSession = Depends(get_async_db_session), skip: int = 0, limit: int = 10
):
    """
    Fetch a list of cooperative groups with optional pagination.
    """

    return await CooperativeGroupService.get_coop_groups(db, skip=skip, limit=limit)



@router.get("/me", response_model=list[CoopGroupDetails])
async def get_my_circles(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    return await CooperativeGroupService.get_user_circles(db, str(user.id))


@router.get("/{coop_id}", response_model=CoopGroupDetails)
async def get_coop(
    coop_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    coop = await CooperativeGroupService.get_coop_group_by_id(
        db, coop_id, requesting_user_id=str(user.id)
    )
    if not coop:
        raise HTTPException(status_code=404, detail="Circle not found")
    return coop

@router.get("/public/{coop_id}", response_model=CoopGroupDetails)
async def get_circle_public(
    coop_id: str,
    db: AsyncSession = Depends(get_async_db_session),
):
    """Public endpoint — no auth. Used by invite preview pages."""
    circle = await CooperativeGroupService.get_coop_group_by_id(db, coop_id)
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found")
    return circle


@router.get("/{coop_id}/members", response_model=list[CircleMemberDetail])
async def get_circle_members(
    coop_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    coop = await CooperativeGroupService.get_coop_group_by_id(db, coop_id)
    if not coop:
        raise HTTPException(status_code=404, detail="Circle not found")
    return await CooperativeGroupService.get_circle_members(
        db, coop_id, coop.current_round
    )


@router.get("/{coop_id}/history", response_model=list[CircleHistoryEntry])
async def get_circle_history(
    coop_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    return await CooperativeGroupService.get_circle_history(db, coop_id)






@router.post("/{coop_id}/join", response_model=CoopGroupDetails)
async def join_circle(
    coop_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Authenticated. Adds user as a member, calls Flow stub, returns updated circle.
    """
    coop = await CooperativeGroupService.get_coop_group_by_id(db, coop_id)
    if not coop:
        raise HTTPException(status_code=404, detail="Circle not found")

    if coop.status == CooperativeStatus.inactive:
        raise HTTPException(status_code=400, detail="This circle is no longer active")


    print("\nGot coop", coop, "\n")
    # Check if already a member
    existing = await CooperativeMembershipService.get_membership_by_user_and_group(
        user.id, UUID(coop_id), db
    )
    if existing and existing.status == "accepted":
        raise HTTPException(status_code=400, detail="Already a member of this circle")

    # 3. Check capacity
    if coop.member_count >= coop.max_members:
        raise HTTPException(status_code=400, detail="This circle is full")

    # Get next queue position
    count_stmt = select(func.count()).where(
        GroupMembership.group_id == UUID(coop_id),
        GroupMembership.status == "accepted",
    )
    
    member_count = (await db.execute(count_stmt)).scalar() or 0
    next_position = member_count + 1

    
    # Submit to Flow stub — replace with real JoinCircle.cdc call later
    try:
        tx_id = await flow_service.join_circle(
            circle_id=coop.chain_circle_id or 0,
            member_address=user.flow_address or "",
        )
    except Exception as e:
        logger.warning(f"Flow join_circle stub failed (non-fatal): {e}")
        tx_id = None
    
    print("\n COnfirmed Memberships - next count", member_count, next_position, "\n")
    # Create membership
    membership_data = MembershipCreate(
        user_id=user.id,
        group_id=UUID(coop_id),
        invited_by=coop.creator_id,
        role="member",
        status="accepted",
        queue_position=next_position,
    )
    await CooperativeMembershipService.create_membership(db, membership_data, user)

    print("\n Created membership\n")


    # Activity log
    try:
        await ActivityService.log(db, ActivityCreate(
            user_id=user.id,
            type=ActivityType.joined_group.value,
            description=f"You joined circle: {coop.name}",
            group_id=UUID(coop_id),
            entity_id=coop_id,
            amount=None,
        ))
    except Exception as e:
        logger.warning(f"Activity log failed (non-fatal): {e}")

    # Notification
    try:
        await NotificationService.create_and_push_notification_to_user(
            NotificationCreate(
                user_id=user.id,
                title="Circle joined",
                message=f"You are now a member of '{coop.name}'.",
                event_type="group",
                type="success",
                entity_url=f"/dashboard/circle/{coop_id}",
            ),
            db,
        )
    except Exception as e:
        logger.warning(f"Notification failed (non-fatal): {e}")

    updated = await CooperativeGroupService.get_coop_group_by_id(
        db, coop_id, requesting_user_id=str(user.id)
    )
    return updated









@router.get("/ext/{coop_id}")
async def get_extended_coop(
    coop_id: str, db: AsyncSession = Depends(get_async_db_session)
):
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
    db: AsyncSession = Depends(get_async_db_session),
):
    """
    Update a cooperative group's details by its ID.
    """
    updated_coop = await CooperativeGroupService.update_coop(
        db, coop_id, coop_update_data
    )
    if not updated_coop:
        raise HTTPException(status_code=404, detail="Cooperative group not found")
    return updated_coop


@router.delete("/{coop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coop(coop_id: str, db: AsyncSession = Depends(get_async_db_session)):
    """
    Delete a cooperative group by its ID.
    Returns 204 No Content if successful.
    """
    deleted_coop = await CooperativeGroupService.delete_coop(db, coop_id)
    if not deleted_coop:
        raise HTTPException(status_code=404, detail="Cooperative group not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)
