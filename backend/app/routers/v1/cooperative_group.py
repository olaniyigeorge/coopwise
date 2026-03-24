from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List


from db.models.activity_model import ActivityType
from app.routers.v1.auth import get_current_user
from app.utils.logger import logger
from app.schemas.activity_schemas import ActivityCreate
from app.schemas.auth import AuthenticatedUser
from app.schemas.cooperative_group import (
    CoopGroupCreate,
    CoopGroupDetails,
    CoopGroupUpdate,
    JoinCircleResponse,
    CooperativeStatus
)

from app.schemas.cooperative_membership import MembershipCreate
from app.schemas.notifications_schema import NotificationCreate
from app.services.activity_service import ActivityService
from app.services.notification_service import NotificationService
from db.dependencies import get_async_db_session
from app.services.cooperative_group_service import CooperativeGroupService
from app.services.membership_service import CooperativeMembershipService

# from app.services.chain import w3, poolfactory, from_account, PRIVATE_KEY

from app.services.flow_service import flow_service
from app.services.fx_service import fx_service


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
        queue_position=1 if coop_data.rotation_order == "sequential" else None,
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






















@router.get("/", response_model=List[CoopGroupDetails])
async def list_cooperative_groups(
    db: AsyncSession = Depends(get_async_db_session), skip: int = 0, limit: int = 10
):
    """
    Fetch a list of cooperative groups with optional pagination.
    """

    return await CooperativeGroupService.get_coop_groups(db, skip=skip, limit=limit)


@router.get("/me", response_model=List[CoopGroupDetails])
async def list_cooperative_groups(
    db: AsyncSession = Depends(get_async_db_session), skip: int = 0, limit: int = 10
):
    """
    Fetch a list of cooperative groups with optional pagination.
    """

    return await CooperativeGroupService.get_coop_groups(db, skip=skip, limit=limit)


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
