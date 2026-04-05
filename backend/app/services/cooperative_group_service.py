import datetime
from typing import List, Optional
from uuid import UUID
from fastapi.encoders import jsonable_encoder
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, desc
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from app.schemas.contribution_schemas import CircleHistoryEntry, ContributionDetail
from app.schemas.cooperative_membership import CircleMemberDetail, MembershipExtDetails
from app.schemas.cooperative_group import (
    CoopGroupCreate,
    CoopGroupDetails,
    CoopGroupUpdate,
)
from app.schemas.auth import AuthenticatedUser
from app.schemas.dashboard_schema import ExploreGroups

from db.models.user import User
from db.models.contribution_model import Contribution, ContributionStatus
from db.models.membership import GroupMembership, MembershipStatus
from db.models.cooperative_group import (
    ContributionFrequency,
    CooperativeGroup,
    CooperativeStatus,
)

from app.utils.logger import logger
from app.utils.cache import get_cache, update_cache
from config import AppConfig as config


class CooperativeGroupService:
    # Create and manage cooperative groups.

    @staticmethod
    async def create_coop(coop_data: CoopGroupCreate, db: AsyncSession) -> CooperativeGroup:
        try:
            new_coop_group = CooperativeGroup(
                name=coop_data.name,
                description=coop_data.description,
                image_url=coop_data.image_url,
                creator_id=coop_data.creator_id,
                max_members=coop_data.max_members,
                contribution_amount=coop_data.contribution_amount,
                contribution_frequency=coop_data.contribution_frequency,
                payout_strategy=coop_data.payout_strategy,
                coop_model=coop_data.coop_model,
                target_amount=coop_data.target_amount,
                status=coop_data.status,
                rules=coop_data.rules or None,
                # Chain fields
                chain_circle_id=coop_data.chain_circle_id,
                weekly_amount_usdc=coop_data.weekly_amount_usdc,
                currency=coop_data.currency,
                rotation_order=coop_data.rotation_order,
                current_round=coop_data.current_round,
                is_complete=coop_data.is_complete,
                join_policy=coop_data.join_policy.value,
            )
            db.add(new_coop_group)
            await db.commit()
            await db.refresh(new_coop_group)
            logger.info(f"\n\nCoop created: {new_coop_group.id}\n")
        except Exception as e:
            await db.rollback()
            logger.error(f"create_coop failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not create cooperative group — {str(e)}",
            )
        return new_coop_group


    @staticmethod
    async def get_coop_groups(db: AsyncSession, skip: int = 0, limit: int = 10):
        try:
            stmt = (
                select(CooperativeGroup)
                .order_by(desc(CooperativeGroup.created_at))
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            coop_groups = result.scalars().all()
        except Exception as e:
            logger.error(e)
            raise e
        return coop_groups

    @staticmethod
    async def list_open_groups(
        db: AsyncSession,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
    ) -> list[CoopGroupDetails]:
        """Circles that are open to join, not full, excluding groups the user is already in."""
        joined_stmt = select(GroupMembership.group_id).where(
            GroupMembership.user_id == user_id
        )
        joined_res = await db.execute(joined_stmt)
        joined_ids = [row[0] for row in joined_res.all()]

        filters = [
            CooperativeGroup.status == CooperativeStatus.active,
            CooperativeGroup.join_policy == "open",
        ]
        if joined_ids:
            filters.append(CooperativeGroup.id.notin_(joined_ids))

        stmt = (
            select(CooperativeGroup)
            .where(*filters)
            .order_by(desc(CooperativeGroup.created_at))
            .offset(skip)
            .limit(limit * 2)
        )
        result = await db.execute(stmt)
        groups = result.scalars().all()
        out: list[CoopGroupDetails] = []
        for g in groups:
            count_stmt = select(func.count()).where(
                GroupMembership.group_id == g.id,
                GroupMembership.status == "accepted",
            )
            member_count = int((await db.execute(count_stmt)).scalar() or 0)
            max_m = int(float(g.max_members))
            if member_count >= max_m:
                continue
            details = CoopGroupDetails.model_validate(g)
            details.member_count = member_count
            out.append(details)
            if len(out) >= limit:
                break
        return out




    @staticmethod
    async def get_coop_group_by_id(
        db: AsyncSession, coop_group_id: str, requesting_user_id: Optional[str] = None
    ) -> Optional[CoopGroupDetails]:
        try:
            stmt = select(CooperativeGroup).where(
                CooperativeGroup.id == coop_group_id
            )
            result = await db.execute(stmt)
            coop = result.scalars().first()
            if not coop:
                return None

            # Member count
            count_stmt = select(func.count()).where(
                GroupMembership.group_id == coop.id,
                GroupMembership.status == "accepted",
            )
            member_count = (await db.execute(count_stmt)).scalar() or 0

            details = CoopGroupDetails.model_validate(coop)
            details.member_count = member_count

            # Caller's queue position
            if requesting_user_id:
                pos_stmt = select(GroupMembership.payout_position).where(
                    GroupMembership.group_id == coop.id,
                    GroupMembership.user_id == requesting_user_id,
                )
                pos = (await db.execute(pos_stmt)).scalar()
                details.your_position_in_queue = pos

            return details
        except Exception as e:
            logger.error(f"get_coop_group_by_id: {e}")
            raise

    @staticmethod
    async def get_user_circles(
        db: AsyncSession, user_id: str
    ) -> list[CoopGroupDetails]:
        stmt = (
            select(CooperativeGroup)
            .join(GroupMembership, GroupMembership.group_id == CooperativeGroup.id)
            .where(
                GroupMembership.user_id == user_id,
                GroupMembership.status == "accepted",
            )
            .order_by(CooperativeGroup.created_at.desc())
        )
        result = await db.execute(stmt)
        groups = result.scalars().all()

        out = []
        for g in groups:
            count_stmt = select(func.count()).where(
                GroupMembership.group_id == g.id,
                GroupMembership.status == "accepted",
            )
            member_count = (await db.execute(count_stmt)).scalar() or 0
            details = CoopGroupDetails.model_validate(g)
            details.member_count = member_count
            out.append(details)
        return out

    @staticmethod
    async def get_circle_members(
        db: AsyncSession, circle_id: str, current_round: int
    ) -> list[CircleMemberDetail]:
        stmt = (
            select(GroupMembership, User)
            .join(User, User.id == GroupMembership.user_id)
            .where(
                GroupMembership.group_id == circle_id,
                GroupMembership.status == "accepted",
            )
            .order_by(GroupMembership.payout_position)
        )
        rows = (await db.execute(stmt)).all()

        # Check who contributed this round
        contrib_stmt = select(Contribution.user_id).where(
            Contribution.group_id == circle_id,
            Contribution.round_number == current_round,
        )
        contributed_ids = set(
            (await db.execute(contrib_stmt)).scalars().all()
        )

        return [
            CircleMemberDetail(
                user_id=membership.user_id,
                group_id=membership.group_id,
                role=membership.role.value,
                status=membership.status.value,
                payout_position=membership.payout_position,   # was queue_position
                has_received_payout_this_cycle=membership.has_received_payout_this_cycle,
                joined_at=membership.joined_at,
                full_name=user.full_name,
                username=user.username,
                profile_picture_url=user.profile_picture_url,
                flow_address=user.flow_address,
                is_email_verified=user.is_email_verified,
                has_contributed_this_round=membership.user_id in contributed_ids,
            )
            for membership, user in rows
        ]

    @staticmethod
    async def get_circle_history(
        db: AsyncSession, circle_id: str
    ) -> list[CircleHistoryEntry]:
        stmt = (
            select(Contribution, User)
            .join(User, User.id == Contribution.user_id)
            .where(Contribution.group_id == circle_id)
            .order_by(Contribution.created_at.desc())
            .limit(50)
        )
        rows = (await db.execute(stmt)).all()

        return [
            CircleHistoryEntry(
                contribution_id=contrib.id,
                amount=float(contrib.amount),
                currency=contrib.currency,
                status=contrib.status.value,
                note=contrib.note,
                due_date=contrib.due_date,
                fulfilled_at=contrib.fulfilled_at,
                created_at=contrib.created_at,
                member_name=user.full_name or user.username or "Member",
                member_address=user.flow_address,
                explorer_url=None,   # populate once tx_id column is added
            )
            for contrib, user in rows
        ]











    @staticmethod
    async def get_ext_coop_group_by_id(db: AsyncSession, coop_group_id: str):
        # 1. Fetch group
        stmt = select(CooperativeGroup).where(CooperativeGroup.id == coop_group_id)
        result = await db.execute(stmt)
        group: CooperativeGroup = result.scalars().first()

        if not group:
            return None

        # 2. Get active memberships (ACCEPTED)
        membership_stmt = (
            select(GroupMembership)
            .where(
                GroupMembership.group_id == coop_group_id,
                GroupMembership.status == MembershipStatus.accepted,
            )
            .options(joinedload(GroupMembership.user))
        )
        members_result = await db.execute(membership_stmt)
        members = members_result.scalars().all()
        member_ids = [m.user_id for m in members]

        # 3. Get contributions by accepted members (completed)
        contrib_stmt = select(Contribution).where(
            Contribution.group_id == coop_group_id,
            Contribution.user_id.in_(member_ids),
            Contribution.status == ContributionStatus.completed,
        )
        contrib_result = await db.execute(contrib_stmt)
        contributions = contrib_result.scalars().all()

        # Calculate total_saved from the contributions you just fetched
        total_saved = sum(c.amount or 0 for c in contributions)

        # 4. Compute progress
        progress = (
            float(total_saved) / float(group.target_amount) * 100
            if group.target_amount
            else 0
        )

        # 5. Determine next contribution date
        today = datetime.datetime.now()
        freq = group.contribution_frequency
        next_contrib_date = None
        if freq == ContributionFrequency.weekly:
            next_contrib_date = today + datetime.timedelta(weeks=1)
        elif freq == ContributionFrequency.monthly:
            next_contrib_date = today + datetime.timedelta(days=30)
        elif freq == ContributionFrequency.daily:
            next_contrib_date = today + datetime.timedelta(days=1)

        next_contribution = {
            "amount": float(group.contribution_amount),
            "due_date": next_contrib_date.isoformat(),
            "days_left": (
                (next_contrib_date - today).days if next_contrib_date else None
            ),
        }

        # 6. Determine next payout
        next_payout = {
            "amount": float(group.contribution_amount) * len(member_ids),
            "recipient": "TBD",
            "date": (
                group.next_payout_date.isoformat() if group.next_payout_date else None
            ),
        }

        # 7. Build final response
        return {
            **group.__dict__,
            "total_saved": float(total_saved),
            "progress": round(progress, 2),
            "members": [MembershipExtDetails.model_validate(m) for m in members],
            "members_count": len(member_ids),
            "contributions": [
                ContributionDetail.model_validate(c) for c in contributions
            ],
            "next_contribution": next_contribution,
            "next_payout": next_payout,
        }

    @staticmethod
    async def update_coop(
        db: AsyncSession, coop_group_id: str, coop_group_update_data: CoopGroupUpdate
    ) -> Optional[CooperativeGroup]:
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
    async def delete_coop(
        db: AsyncSession, coop_group_id: str
    ) -> Optional[CooperativeGroup]:
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
    async def get_my_coop_groups(
        db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 10
    ):
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
        page_size: int = 10,
    ) -> ExploreGroups:
        cache_key = f"groups:{user.id}:page:{page}"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(
                f"🔄 Using cached user & suggested groups for user {user.id} (page {page})"
            )
            return cached

        logger.info(
            f"Fetching user & suggested groups for user {user.id} (page {page})"
        )

        # 1. Fetch user's group memberships
        user_group_stmt = (
            select(CooperativeGroup)
            .join(GroupMembership, CooperativeGroup.id == GroupMembership.group_id)
            .where(GroupMembership.user_id == user.id)
            .options(joinedload(CooperativeGroup.memberships))
        )
        user_groups_result = await db.execute(user_group_stmt)
        user_groups: List[CooperativeGroup] = (
            user_groups_result.unique().scalars().all()
        )
        user_group_ids = [group.id for group in user_groups]

        # 2. Fetch suggested groups (not already joined)
        offset = (page - 1) * page_size
        suggested_group_stmt = (
            select(CooperativeGroup)
            .where(
                CooperativeGroup.status == CooperativeStatus.active,
                CooperativeGroup.join_policy == "open",
                CooperativeGroup.id.notin_(user_group_ids),
            )
            .limit(page_size)
            .offset(offset)
        )
        suggested_groups_result = await db.execute(suggested_group_stmt)
        suggested_groups: List[CooperativeGroup] = (
            suggested_groups_result.scalars().all()
        )

        result = ExploreGroups(
            user_groups=[CoopGroupDetails.model_validate(g) for g in user_groups],
            suggested_groups=[
                CoopGroupDetails.model_validate(g) for g in suggested_groups
            ],
        )
        result_serializable = jsonable_encoder(result)

        await update_cache(cache_key, result_serializable, ttl=300)
        logger.info(
            f"📦 Cached user & suggested groups for user {user.id} (page {page})"
        )

        return result_serializable
