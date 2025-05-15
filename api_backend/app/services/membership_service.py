from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas.user import UserRead
from db.models.cooperative_group import CooperativeGroup
from db.models.user import User
from app.schemas.auth import AuthenticatedUser
from app.schemas.cooperative_membership import AcceptMembership, MembershipCreate
from db.models.membership import GroupMembership
from app.utils import logger
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
            logger.logger.error(e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"Could not fetch cooperative group details - {str(e)}"
            )
        user = UserRead(
            id=invited_by_user.id,
            username=invited_by_user.username,
            email=invited_by_user.email
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
        user: AuthenticatedUser

    ) -> Optional[GroupMembership]:
        try:          
            stmt = select(GroupMembership).filter(GroupMembership.group_id == group_id, GroupMembership.user_id == user.id)
            result = await db.execute(stmt)
            existing_membership = result.scalars().first()

            if existing_membership:
                return existing_membership

            new_membership = GroupMembership(
                user_id = user.id,
                group_id = group_id,
                role = accept_invite_data.role,
                invited_by = accept_invite_data.invited_by,
                status = accept_invite_data.status               
            )
            db.add(new_membership)
            await db.commit()
            await db.refresh(new_membership)
        except Exception as e:
            await db.rollback()
            logger.logger.error(e)
            raise e

        return new_membership
    

    # Confirms membership - Sets membership state to accepted
    @staticmethod
    async def confirm_membership(
        option: str,
        membership_id: int, 
        db:AsyncSession,
        user: AuthenticatedUser, 
        
    ):
        # print(
        #     f'''
        #       \n OPTION: {db} 
        #       \n MEM_ID: {user} 
        #       \n DB: {option} 
        #       \n USER: {membership_id}\n
        #     '''
        # )
        print(f"\n Saying {db} to membership {user} by {membership_id}\n")
        try:
            # TODO: Prefetch group data
            stmt = select(GroupMembership).where(GroupMembership.id == user)
            result = await option.execute(stmt)
            membership = result.scalars().first()

            # if membership:
            stmt = select(CooperativeGroup).where(CooperativeGroup.id == membership.group_id)
            group_result = await option.execute(stmt)
            coop_group = group_result.scalars().first()

            # check is user is the group creator or has a membership with elevated role
            if coop_group.creator_id != membership_id.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permissions to confirm a membership")

            if db == "yes":
                membership.status = "ACCEPTED"
                await option.commit()
                await option.refresh(membership)
        
        except Exception as e:
            logger.logger.error(e)
            raise e
        return membership

        
    # Gets all the memberships that belongs to a cooperative group
    @staticmethod
    async def get_memberships_by_group(
        coop_id: UUID, 
        filter: str,
        db: AsyncSession, 
        # user: AuthenticatedUser,
        skip: int = 0, 
        limit: int = 10,  
    ):
        try:
            stmt = select(GroupMembership).where(GroupMembership.group_id == coop_id).offset(skip).limit(limit)
            result = await db.execute(stmt)
            memberships = result.scalars().all()
        except Exception as e:
            logger.logger.error(e)
            raise e
        return memberships


    # Listing all memberships 
    @staticmethod
    async def list_coop_memberships(
        db: AsyncSession, 
        user: AuthenticatedUser,
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
            logger.logger.error(e)
            raise e
        return memberships

    # Fetch individual membership by id
    @staticmethod
    async def get_coop_membership_by_id(
        db: AsyncSession, 
        user: AuthenticatedUser,
        membership_id: int
    ) -> Optional[GroupMembership]:
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized! Sign In!!!")
        

        try:
            stmt = select(GroupMembership).where(GroupMembership.id == membership_id)
            result = await db.execute(stmt)
            membership = result.scalars().first()
        except Exception as e:
            logger.logger.error(e)
            raise e
        

        if membership and user.role != "admin" and membership.user_id and user.id and user.id != membership.user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="You are not authorized to view this membership")
        
        return membership

    # Cancel membership
    @staticmethod
    async def delete_membership(
        db: AsyncSession, 
        coop_membership_id: int,
        user: AuthenticatedUser,
    ) -> Optional[GroupMembership]:

        try:
            stmt = select(GroupMembership).where(GroupMembership.id == coop_membership_id)
            result = await db.execute(stmt)
            membership = result.scalars().first()

            if not membership:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memebership not found")

            if user.id != membership.user_id and user.id != 'admin':
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permissions to delete this memebrship")
            
            if user.role == "admin":
                await db.delete(membership)
                await db.commit()
            else:
                membership.status = "CANCELLED"
                await db.commit()
                await db.refresh(membership)
        except Exception as e:
            await db.rollback()
            logger.logger.error(e)
            raise e

        return membership
