
# Define rules, add/remove members.

# Enforce rotation rules and statuses.

import datetime
from typing import List, Optional
from uuid import UUID
from fastapi.encoders import jsonable_encoder
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy import desc
from jose import jwt, JWTError

from sqlalchemy.orm import joinedload

from db.models.contribution_model import Contribution, ContributionStatus
from app.schemas.auth import AuthenticatedUser
from app.schemas.dashboard_schema import ExploreGroups
from app.utils.cache import get_cache, update_cache
from db.models.membership import GroupMembership, MembershipStatus
from app.schemas.cooperative_group import CoopGroupCreate, CoopGroupDetails, CoopGroupUpdate
from db.models.cooperative_group import ContributionFrequency, CooperativeGroup, CooperativeStatus
from app.utils.logger import logger
from app.core.config import config
from fastapi import HTTPException, status


class CooperativeGroupService:
    # Create and manage cooperative groups.

    @staticmethod
    async def create_coop(coop_data: CoopGroupCreate, db: AsyncSession):
        try:
            
            new_coop_group = CooperativeGroup(
                name=coop_data.name,
                creator_id=coop_data.creator_id,
                contribution_amount=coop_data.contribution_amount,
                contribution_frequency=coop_data.contribution_frequency,
                payout_strategy=coop_data.payout_strategy,
                target_amount=coop_data.target_amount,
                status=coop_data.status,
                rules=coop_data.rules if coop_data.rules else None
            )
            db.add(new_coop_group)
            await db.commit()
            await db.refresh(new_coop_group)
            print("\n\n coop created....\n")
        except Exception as e:
            logger.error(e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Could not create cooperative group - {str(e)}"
            )
        return new_coop_group 

    @staticmethod
    async def get_coop_groups(db: AsyncSession, skip: int = 0, limit: int = 10):
        try:
            stmt = select(CooperativeGroup).order_by(desc(CooperativeGroup.created_at)).offset(skip).limit(limit)
            result = await db.execute(stmt)
            coop_groups = result.scalars().all()
        except Exception as e:
            logger.error(e)
            raise e
        return coop_groups

    @staticmethod
    async def get_coop_group_by_id(db: AsyncSession, coop_group_id: str) -> Optional[CooperativeGroup]:
        try:
            stmt = select(CooperativeGroup).where(CooperativeGroup.id == coop_group_id)
            result = await db.execute(stmt)
            coop_group = result.scalars().first()
        except Exception as e:
            logger.error(e)
            raise e
        return coop_group
    

    @staticmethod
    async def get_ext_coop_group_by_id(db: AsyncSession, coop_group_id: str):
        # 1. Fetch group
        stmt = select(CooperativeGroup).where(CooperativeGroup.id == coop_group_id)
        result = await db.execute(stmt)
        group: CooperativeGroup = result.scalars().first()

        if not group:
            return None

        # 2. Get active memberships (ACCEPTED)
        membership_stmt = select(GroupMembership).where(
            GroupMembership.group_id == coop_group_id,
            GroupMembership.status == MembershipStatus.ACCEPTED
        )
        members_result = await db.execute(membership_stmt)
        members = members_result.scalars().all()
        member_ids = [m.user_id for m in members]

        # 3. Get contributions by accepted members (COMPLETED)
        contrib_stmt = select(func.sum(Contribution.amount)).where(
            Contribution.group_id == coop_group_id,
            Contribution.user_id.in_(member_ids),
            Contribution.status == ContributionStatus.COMPLETED
        )
        contrib_result = await db.execute(contrib_stmt)
        total_saved = contrib_result.scalar() or 0

        # 4. Compute progress
        progress = float(total_saved) / float(group.target_amount) * 100 if group.target_amount else 0

        # 5. Determine next contribution date
        today = datetime.datetime.now()
        freq = group.contribution_frequency
        next_contrib_date = None
        if freq == ContributionFrequency.WEEKLY:
            next_contrib_date = today + datetime.timedelta(weeks=1)
        elif freq == ContributionFrequency.MONTHLY:
            next_contrib_date = today + datetime.timedelta(days=30)
        elif freq == ContributionFrequency.DAILY:
            next_contrib_date = today + datetime.timedelta(days=1)

        next_contribution = {
            "amount": float(group.contribution_amount),
            "due_date": next_contrib_date.isoformat(),
            "days_left": (next_contrib_date - today).days if next_contrib_date else None
        }

        # 6. Determine next payout (you can improve logic based on rotation queue)
        next_payout = {
            "amount": float(group.contribution_amount) * len(member_ids),
            "recipient": "TBD",  # Optional: you can find the next in queue by lowest payout_position
            "date": group.next_payout_date.isoformat() if group.next_payout_date else None
        }

        # 7. Build final response
        return {
            **group.__dict__,
            "total_saved": float(total_saved),
            "progress": round(progress, 2),
            "members_count": len(member_ids),
            "next_contribution": next_contribution,
            "next_payout": next_payout,
        }

    @staticmethod
    async def update_coop(db: AsyncSession, coop_group_id: str, coop_group_update_data: CoopGroupUpdate) -> Optional[CooperativeGroup]:
        try:
            stmt = select(CooperativeGroup).where(CooperativeGroup.id == coop_group_id)
            result = await db.execute(stmt)
            coop_group = result.scalars().first()

            if not coop_group:
                return None

            for var, value in vars(coop_group_update_data).items():
                setattr(coop_group, var, value) if value is not None else None

            await db.commit()
            await db.refresh(coop_group)
        except Exception as e:
            await db.rollback()
            logger.error(e)
            raise e

        return coop_group
            
    @staticmethod
    async def delete_coop(db: AsyncSession, coop_group_id: str) -> Optional[CooperativeGroup]:
        try:
            stmt = select(CooperativeGroup).where(CooperativeGroup.id == coop_group_id)
            result = await db.execute(stmt)
            coop_group = result.scalars().first()

            if not coop_group:
                return None

            await db.delete(coop_group)
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.error(e)
            raise e

        return coop_group


    @staticmethod
    async def get_my_coop_groups(db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 10):
        try:
            stmt = (
                select(CooperativeGroup)
                .join(GroupMembership)
                .where(GroupMembership.user_id == user_id)
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            groups = result.scalars().all()
            return groups
        except Exception as e:
            logger.error(e)
            raise


    @staticmethod
    async def get_user_and_suggested_groups(
        user: AuthenticatedUser,
        db: AsyncSession,
        redis: Redis,
        page: int = 1,
        page_size: int = 10
    ) -> ExploreGroups:
        cache_key = f"groups:{user.id}:page:{page}"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(f"🔄 Using cached user & suggested groups for user {user.id} (page {page})")
            return cached
        
        logger.info(f"Fetching user & suggested groups for user {user.id} (page {page})")

        # 1. Fetch user's group memberships
        user_group_stmt = (
            select(CooperativeGroup)
            .join(GroupMembership, CooperativeGroup.id == GroupMembership.group_id)
            .where(GroupMembership.user_id == user.id)
            .options(joinedload(CooperativeGroup.memberships))
        )
        user_groups_result = await db.execute(user_group_stmt)
        user_groups: List[CooperativeGroup] = user_groups_result.unique().scalars().all()
        user_group_ids = [group.id for group in user_groups]

        # 2. Fetch suggested groups (not already joined)
        offset = (page - 1) * page_size
        suggested_group_stmt = (
            select(CooperativeGroup)
            .where(
                CooperativeGroup.status == CooperativeStatus.ACTIVE,
                CooperativeGroup.id.notin_(user_group_ids)
            )
            .limit(page_size)
            .offset(offset)
        )
        suggested_groups_result = await db.execute(suggested_group_stmt)
        suggested_groups: List[CooperativeGroup] = suggested_groups_result.scalars().all()

        result = ExploreGroups(
            user_groups= [CoopGroupDetails.model_validate(g) for g in user_groups],
            suggested_groups=[CoopGroupDetails.model_validate(g) for g in suggested_groups]
        )
        result_serializable = jsonable_encoder(result)
        
        await update_cache(cache_key, result_serializable, ttl=300)
        logger.info(f"📦 Cached user & suggested groups for user {user.id} (page {page})")

        return result_serializable