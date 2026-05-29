import json
from typing import List
from redis import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.infra.cache.redis_client import get_cache, update_cache
from src.domains.analytics.schemas import ActivityCreate, ActivityDetail
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.analytics.models import ActivityLog
from datetime import datetime
from uuid import UUID
from src.shared.utils.logger import logger


class ActivityService:
    @staticmethod
    async def log(db: AsyncSession, activity_data: ActivityCreate):
        activity = ActivityLog(
            user_id=activity_data.user_id,
            type=activity_data.type,
            description=activity_data.description,
            group_id=activity_data.group_id,
            entity_id=str(activity_data.entity_id),
            amount=activity_data.amount,
            created_at=datetime.now(),
        )
        db.add(activity)
        await db.commit()
        await db.refresh(activity)
        return activity

    @staticmethod
    async def get_user_recent_activities(
        db: AsyncSession, user: AuthenticatedUser, redis: Redis
    ) -> List[ActivityDetail]:

        cache_key = f"activities:{user.id}:skip:{1}:limit:{50}"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(
                f"🔄 Using cached Activities for user {user.id} (skip={1}, limit={50})"
            )
            # Deserialize if values are strings
            deserialized = [
                json.loads(item) if isinstance(item, str) else item for item in cached
            ]

            return [ActivityDetail.model_validate(item) for item in deserialized]

        logger.info(
            f"📬 Fetching Activity logs for user {user.id} from database (skip={1}, limit={50})"
        )

        try:
            result = await db.execute(
                select(ActivityLog)
                .where(ActivityLog.user_id == user.id)
                .order_by(ActivityLog.created_at.desc())
                .limit(50)
            )

            activity_logs = result.scalars().all()

            serialized = [
                json.dumps(ActivityDetail.model_validate(i).model_dump(mode="json"))
                for i in activity_logs
            ]

            await update_cache(cache_key, serialized, ttl=4 * 60)
            return [ActivityDetail.model_validate(json.loads(i)) for i in serialized]

        except Exception as e:
            logger.error(e)
            raise e

    @staticmethod
    async def get_group_activities(
        db: AsyncSession,
        group_id: UUID,
        user: AuthenticatedUser,
        redis: Redis,
        skip: int = 0,
        limit: int = 20,
    ):
        result = await db.execute(
            select(ActivityLog)
            .where(ActivityLog.group_id == group_id)
            .order_by(ActivityLog.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()





import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from redis.asyncio import Redis
from datetime import datetime

from src.domains.wallets.service import WalletService
from src.domains.auth.schemas import AuthenticatedUser
from src.domains.circles.schemas import CoopGroupTargetSummary
from src.domains.dashboard.schemas import Summary, Targets
from src.infra.cache.redis_client import get_cache, update_cache
from src.domains.contributions.models import Contribution, ContributionStatus
from src.domains.memberships.models import GroupMembership
from src.domains.circles.models import CooperativeGroup
from src.domains.memberships.service import CooperativeMembershipService
from src.shared.utils.logger import logger
from src.domains.users.models import User


class SummaryService:

    @staticmethod
    async def get_user_summary(
        user: AuthenticatedUser, db: AsyncSession, redis: Redis
    ) -> Summary:

        key = f"summary:{user.id}"
        cached_summary = await get_cache(key)
        if cached_summary:
            logger.info(f"🔄 Using cached summary for user {user.id}")

            if isinstance(cached_summary, str):
                cached_summary = json.loads(cached_summary)

            wallet = await WalletService.get_wallet(db, user, redis)

            if isinstance(
                cached_summary.get("wallet"), str
            ):  # Doing this because the wallet and it's cache are updated separately
                logger.info("\n Setting more recent wallet details.... \n")
                cached_summary["wallet"] = json.loads(wallet)

            return cached_summary

        async def fetch_summary():
            # 1. Your savings: sum of contributions
            savings_query = await db.execute(
                select(func.sum(Contribution.amount)).where(
                    Contribution.user_id == user.id,
                    Contribution.status == ContributionStatus.completed,
                )
            )
            your_savings = savings_query.scalar() or 0.0

            # 2. Next contribution date
            # TODO Create a a the contribution for all members on payout
            next_contrib_query = await db.execute(
                select(Contribution.due_date)
                .where(
                    Contribution.user_id == user.id,
                    Contribution.due_date != None,
                    Contribution.due_date > datetime.now(),
                )
                .order_by(Contribution.due_date.asc())
                .limit(1)
            )
            next_contribution = next_contrib_query.scalar()

            # 3. Get user’s group memberships
            memberships = await CooperativeMembershipService.get_memberships_by_user(
                user.id, db
            )
            group_ids = [membership.group_id for membership in memberships]

            # 4. Next payout date from all user groups
            next_payout_query = await db.execute(
                select(CooperativeGroup.next_payout_date, CooperativeGroup.id)
                .where(
                    CooperativeGroup.id.in_(group_ids),
                    CooperativeGroup.next_payout_date != None,
                    CooperativeGroup.next_payout_date > datetime.now(),
                )
                .order_by(CooperativeGroup.next_payout_date.asc())
                .limit(1)
            )
            next_payout_result = next_payout_query.first()
            next_payout, next_payout_group_id = (
                next_payout_result if next_payout_result else (None, None)
            )

            # 5. From that group, get the user’s payout number
            # payout_number: Optional[int] = None
            # if next_payout_group_id:
            #     payout_membership_query = await db.execute(
            #         select(GroupMembership.payout_position)
            #         .where(
            #             GroupMembership.user_id == user.id,
            #             GroupMembership.group_id == next_payout_group_id
            #         )
            #     )
            #     payout_number = payout_membership_query.scalar()

            # 6 Get user wallet
            wallet = await WalletService.get_wallet(db, user, redis)

            return Summary(
                your_savings=float(your_savings),
                next_contribution=(
                    next_contribution.isoformat() if next_contribution else None
                ),
                next_payout=next_payout.isoformat() if next_payout else None,
                wallet=wallet,
            )

        fresh_summary: Summary = await fetch_summary()
        await update_cache(key, fresh_summary.model_dump_json(), ttl=180)

        logger.info(f"📦 Cached summary for user {user.id}")
        return fresh_summary

    @staticmethod
    async def get_user_targets(
        user: AuthenticatedUser, db: AsyncSession, redis: Redis
    ) -> Targets:
        cache_key = f"targets:{user.id}"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(f"🔄 Using cached targets for user {user.id}")
            return Targets.model_validate_json(cached)
        logger.info(f"Fetching targets for user {user.id} from database")

        # Fetch user's target_savings_amount
        result = await db.execute(
            select(User.target_savings_amount).where(User.id == user.id)
        )
        savings_target_row = result.scalar()
        savings_target = savings_target_row or 0.0

        # Fetch groups the user is in and their target_amounts
        stmt = (
            select(
                CooperativeGroup.id,
                CooperativeGroup.name,
                CooperativeGroup.contribution_amount,
                CooperativeGroup.target_amount,
            )
            .join(GroupMembership, CooperativeGroup.id == GroupMembership.group_id)
            .where(GroupMembership.user_id == user.id)
        )
        result = await db.execute(stmt)
        groups = result.all()

        group_goals = [
            CoopGroupTargetSummary(
                id=group.id,
                name=group.name,
                contribution_amount=group.contribution_amount,
                target_amount=group.target_amount,
            )
            for group in groups
        ]

        targets = Targets(savings_target=float(savings_target), group_goals=group_goals)

        await update_cache(cache_key, targets.model_dump_json(), ttl=300)
        return targets
