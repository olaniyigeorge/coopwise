from typing import List, Optional
from uuid import UUID
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas.user import UserDetail
from app.utils.cache import get_cache, update_cache
from db.models.cooperative_group import CooperativeGroup
from db.models.user import User
from app.schemas.auth import AuthenticatedUser
from app.schemas.cooperative_membership import (
    AcceptMembership,
    MembershipCreate,
    MembershipDetails,
)
from db.models.membership import GroupMembership
from app.utils.logger import logger
from app.core.config import config
from fastapi import HTTPException, status


class CooperativeMembershipService:

    # Track membership role/status.

    # INVITE USER TO GROUP - Provides data about group and the inviting user
    # Returns the cooperative group's data and inviting user's data to be
    # used in UI components and for submission data
    @staticmethod
    async def invite_user(invited_by: UUID, group_id: UUID, db: AsyncSession):
        # if invite_data.user_id == invite_data.invited_by:
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail="You can't invite yourself"
        #     )

        try:
            stmt = select(CooperativeGroup).where(CooperativeGroup.id == group_id)
            result = await db.execute(stmt)
            coop_group = result.scalars().first()

            stmt = select(User).where(User.id == invited_by)
            result = await db.execute(stmt)
            invited_by_user = result.scalars().first()

        except Exception as e:
            logger.error(e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not fetch cooperative group details - {str(e)}",
            )
        user = UserDetail(
            id=invited_by_user.id,
            username=invited_by_user.username,
            email=invited_by_user.email,
        )
        return {"group": coop_group, "invited_by_user": user}

    # ACCEPTS INVITE TO GROUP - Creates a pending memebership till its accepted by creator
    # Gets or creates a membership in this group for this user setting the
    # provided invited_by user.
    @staticmethod
    async def accept_invite(
        db: AsyncSession,
        group_id: UUID,
        accept_invite_data: AcceptMembership,
        user: AuthenticatedUser,
    ) -> Optional[GroupMembership]:
        try:
            stmt = select(GroupMembership).filter(
                GroupMembership.group_id == group_id, GroupMembership.user_id == user.id
            )
            result = await db.execute(stmt)
            existing_membership = result.scalars().first()

            if existing_membership:
                return existing_membership

            new_membership = GroupMembership(
                user_id=user.id,
                group_id=group_id,
                role=accept_invite_data.role,
                invited_by=accept_invite_data.invited_by,
                status=accept_invite_data.status,
            )
            db.add(new_membership)
            await db.commit()
            await db.refresh(new_membership)
        except Exception as e:
            await db.rollback()
            logger.error(e)
            raise e

        return new_membership

    @staticmethod
    async def create_membership(
        db: AsyncSession, membership_data: MembershipCreate, user: AuthenticatedUser
    ) -> Optional[GroupMembership]:
        try:
            stmt = select(GroupMembership).filter(
                GroupMembership.group_id == membership_data.group_id,
                GroupMembership.user_id == user.id,
            )
            result = await db.execute(stmt)
            existing_membership = result.scalars().first()

            if existing_membership:
                return existing_membership

            new_membership = GroupMembership(
                user_id=user.id,
                group_id=membership_data.group_id,
                role=membership_data.role,
                invited_by=membership_data.invited_by,
                status=membership_data.status,
            )
            db.add(new_membership)
            await db.commit()
            await db.refresh(new_membership)
        except Exception as e:
            await db.rollback()
            logger.error(e)
            raise e

        return new_membership

    # Confirms membership - Sets membership state to accepted
    @staticmethod
    async def confirm_membership(
        option: str,
        membership_id: int,
        db: AsyncSession,
        user: AuthenticatedUser,
    ):
        try:
            # TODO: Prefetch group data
            stmt = select(GroupMembership).where(GroupMembership.id == membership_id)
            result = await db.execute(stmt)
            membership = result.scalars().first()

            # if membership:
            stmt = select(CooperativeGroup).where(
                CooperativeGroup.id == membership.group_id
            )
            group_result = await db.execute(stmt)
            coop_group = group_result.scalars().first()

            # check is user is the group creator or has a membership with elevated role
            if coop_group.creator_id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permissions to confirm a membership",
                )

            if option == "accepted":
                membership.status = "accepted"
            if option == "rejected":
                membership.status = "rejected"
            if option == "pending":
                membership.status = "pending"
            if option == "cancelled":
                membership.status = "cancelled"

            await db.commit()
            await db.refresh(membership)

        except Exception as e:
            logger.error(e)
            raise e
        return membership

    # Generate invite code
    @staticmethod
    async def generate_invite_code(
        db: AsyncSession,
        group_id: UUID,
        inviter_id: UUID,
    ) -> Optional[str]:

        invite_code = config.INVITE_CODE_PREFIX + str(inviter_id) + ":" + str(group_id)
        print(f"\n Invite code: {invite_code} \n")
        try:
            stmt = select(GroupMembership).where(
                GroupMembership.group_id == group_id,
                GroupMembership.invited_by == inviter_id,
            )
            result = await db.execute(stmt)
            existing_membership = result.scalars().first()

            if existing_membership:
                print("Membership exists")
        except Exception as e:
            logger.error(e)
            raise e

        return invite_code

    # Checkout group with invite code
    @staticmethod
    async def checkout_invite_code(
        db: AsyncSession, invite_code: str, user: AuthenticatedUser
    ):
        invited_id__group_id = invite_code[11:]
        inviter_id, group_id = invited_id__group_id.split(":")
        group_id = UUID(group_id)
        inviter_id = UUID(inviter_id)
        try:
            stmt = select(GroupMembership).where(
                GroupMembership.group_id == group_id,
                GroupMembership.invited_by == inviter_id,
                GroupMembership.user_id == user.id,
            )
            result = await db.execute(stmt)
            existing_membership = result.scalars().first()

            if not existing_membership:
                new_membership = GroupMembership(
                    user_id=user.id,
                    group_id=group_id,
                    role="member",
                    invited_by=inviter_id,
                    status="clicked",
                )

                db.add(new_membership)
                await db.commit()
                await db.refresh(new_membership)
                return {
                    "message": "Membership checked out successfully",
                    "membership": new_membership,
                }
            else:
                return {
                    "message": "You have checked this membership out on this group",
                    "membership": existing_membership,
                }
        except Exception as e:
            logger.error(e)
            raise e

    # Accept invite code
    @staticmethod
    async def accept_invite_code(
        db: AsyncSession, user: AuthenticatedUser, invite_code: str
    ) -> Optional[GroupMembership]:
        invited_id__group_id = invite_code[11:]
        inviter_id, group_id = invited_id__group_id.split(":")
        group_id = UUID(group_id)
        inviter_id = UUID(inviter_id)
        try:
            stmt = select(GroupMembership).where(
                GroupMembership.group_id == group_id,
                GroupMembership.invited_by == inviter_id,
                GroupMembership.user_id == user.id,
            )
            result = await db.execute(stmt)
            existing_membership = result.scalars().first()

            if not existing_membership:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Invite code not found or already accepted.",
                )

            existing_membership.status = "pending"
            await db.commit()
            await db.refresh(existing_membership)
        except Exception as e:
            logger.error(e)
            raise e

        return existing_membership

    # Gets all the memberships that belongs to a cooperative group
    @staticmethod
    async def get_memberships_by_group(
        coop_id: UUID,
        filter: str,
        db: AsyncSession,
        # user: AuthenticatedUser, TODO: Allow filtering by membership status
        skip: int = 0,
        limit: int = 10,
    ):
        try:
            stmt = (
                select(GroupMembership)
                .where(GroupMembership.group_id == coop_id)
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            memberships = result.scalars().all()
        except Exception as e:
            logger.error(e)
            raise e
        return memberships

    # Get memberships by user
    @staticmethod
    async def get_memberships_by_user(
        user_id: UUID,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 10,
    ) -> Optional[list[GroupMembership]]:
        try:
            stmt = (
                select(GroupMembership)
                .where(GroupMembership.user_id == user_id)
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            memberships = result.scalars().all()
        except Exception as e:
            logger.error(e)
            raise e

        return memberships

    # Get memberships by user and group
    @staticmethod
    async def get_membership_by_user_and_group(
        user_id: UUID, group_id: UUID, db: AsyncSession
    ) -> Optional[GroupMembership]:
        try:
            stmt = select(GroupMembership).where(
                GroupMembership.user_id == user_id, GroupMembership.group_id == group_id
            )
            result = await db.execute(stmt)
            membership = result.scalars().first()
        except Exception as e:
            logger.error(e)
            raise e

        return membership

    # Get memberships by user
    # Listing all memberships
    @staticmethod
    async def list_coop_memberships(
        db: AsyncSession,
        # user: AuthenticatedUser,
        skip: int = 0,
        limit: int = 10,
    ):
        # if user.role != "admin":
        #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You are not authorized to view memberships")

        try:
            stmt = select(GroupMembership).offset(skip).limit(limit)
            result = await db.execute(stmt)
            memberships = result.scalars().all()
        except Exception as e:
            logger.error(e)
            raise e
        return memberships

    # Fetch individual membership by id
    @staticmethod
    async def get_coop_membership_by_id(
        db: AsyncSession, user: AuthenticatedUser, membership_id: int
    ) -> Optional[GroupMembership]:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized! Sign In!!!",
            )

        try:
            stmt = select(GroupMembership).where(GroupMembership.id == membership_id)
            result = await db.execute(stmt)
            membership = result.scalars().first()
        except Exception as e:
            logger.error(e)
            raise e

        if (
            membership
            and user.role != "admin"
            and membership.user_id
            and user.id
            and user.id != membership.user_id
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You are not authorized to view this membership",
            )

        return membership

    # Cancel membership
    @staticmethod
    async def delete_membership(
        db: AsyncSession,
        coop_membership_id: int,
        user: AuthenticatedUser,
    ) -> Optional[GroupMembership]:

        try:
            stmt = select(GroupMembership).where(
                GroupMembership.id == coop_membership_id
            )
            result = await db.execute(stmt)
            membership = result.scalars().first()

            if not membership:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Memebership not found",
                )

            if user.id != membership.user_id and user.id != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permissions to delete this memebrship",
                )

            if user.role == "admin":
                await db.delete(membership)
                await db.commit()
            else:
                membership.status = "cancelled"
                await db.commit()
                await db.refresh(membership)
        except Exception as e:
            await db.rollback()
            logger.error(e)
            raise e

        return membership

    # Get top memberships ( with more activity or more contributions )
    @staticmethod
    async def get_top_memberships(
        db: AsyncSession, user: AuthenticatedUser, skip: int = 0, limit: int = 10
    ) -> Optional[List[MembershipDetails]]:
        cache_key = f"top_memberships:user:{user.id}:skip:{skip}:limit:{limit}"
        cached = await get_cache(cache_key)

        if cached:
            logger.info(
                f"🔄 Using cached top memberships for user {user.id} (skip={skip}, limit={limit})"
            )
            return [MembershipDetails.model_validate(item) for item in cached]

        logger.info(
            f"🔍 Fetching top memberships for user {user.id} (skip={skip}, limit={limit})"
        )

        try:
            stmt = (
                select(GroupMembership)
                .where(GroupMembership.user_id == user.id)
                .order_by(GroupMembership.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            memberships: List[GroupMembership] = result.scalars().all()

            # Dump to JSON-safe format
            serialized = [
                MembershipDetails.model_validate(m).model_dump(mode="json")
                for m in memberships
            ]

            await update_cache(cache_key, serialized, ttl=300)
            logger.info(f"📦 Cached top memberships for user {cache_key}")
        except Exception as e:
            logger.error(f"❌ Failed to fetch top memberships: {e}")
            raise

        # Re-validate for return
        return [MembershipDetails.model_validate(item) for item in serialized]
