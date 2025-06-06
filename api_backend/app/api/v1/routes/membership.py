from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.schemas.auth import AuthenticatedUser
from app.schemas.cooperative_membership import MembershipDetails
from db.dependencies import get_async_db_session
from app.services.membership_service import CooperativeMembershipService
from app.core.dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/memberships",
    tags=["Memberships"]
)


@router.get("/invite", summary="Generate or check out a cooperative invite code")
async def handle_cooperative_invite(
    group_id: UUID = None,
    invite_code: str = None,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    - If `invite_code` is provided: Join a cooperative using the code.
    - If `invite_code` is not provided: Generate a new invite code for the authenticated user.
    """
    if invite_code:
        # Use invite code to join a cooperative
        try:
            resp = await CooperativeMembershipService.checkout_invite_code(
                user=current_user,
                invite_code=invite_code,
                db=db
            )
            return resp
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    # No invite_code → generate a new one
    try:
        if not group_id:
            raise HTTPException(status_code=400, detail="Group ID is required to generate an invite code.")
        print(f"\nGenerating invite code for group {group_id} and by user {current_user.id}\n")
        invite_code = await CooperativeMembershipService.generate_invite_code(
            inviter_id=current_user.id,
            group_id=group_id,
            db=db
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
    db: AsyncSession = Depends(get_async_db_session)
):
    print("\n⏩ raw invite_code as FastAPI sees it:", invite_code, "\n")
    """
    Accept a cooperative membership invitation using an invite code.
    """
    membership = await CooperativeMembershipService.accept_invite_code(
        db,
        user,
        invite_code
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Invite not found or already accepted.")
    return membership



@router.get("/", response_model=List[MembershipDetails])
async def list_memberships(
    skip: int = 0, 
    limit: int = 10,
    # user: AuthenticatedUser =  Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session)
):
    """
    List cooperative memberships with optional pagination.
    """
    return await CooperativeMembershipService.list_coop_memberships(
        db, 
        #user, 
        skip, 
        limit
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
    db: AsyncSession = Depends(get_async_db_session)
):
    """
    Retrieve a cooperative membership by ID.
    """
    membership = await CooperativeMembershipService.get_coop_membership_by_id(
        db,
        user, 
        membership_id)
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
    user=Depends(get_current_user)
):
    """
    Delete a membership (Admin only).
    """
    deleted = await CooperativeMembershipService.delete_membership(db, membership_id, user)
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
        coop_id,
        filter,
        db)
