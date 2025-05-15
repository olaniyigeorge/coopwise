
# Define rules, add/remove members.

# Enforce rotation rules and statuses.


from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError

from app.schemas.cooperative_group import CoopGroupCreate, CoopGroupUpdate
from db.models.cooperative_group import CooperativeGroup
from app.utils import logger
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
                status=coop_data.status
            )
            db.add(new_coop_group)
            await db.commit()
            await db.refresh(new_coop_group)
        except Exception as e:
            logger.logger.error(e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Could not create cooperative group - {str(e)}"
            )
        return new_coop_group 

    @staticmethod
    async def get_coop_groups(db: AsyncSession, skip: int = 0, limit: int = 10):
        try:
            stmt = select(CooperativeGroup).offset(skip).limit(limit)
            result = await db.execute(stmt)
            coop_groups = result.scalars().all()
        except Exception as e:
            logger.logger.error(e)
            raise e
        return coop_groups

    @staticmethod
    async def get_coop_group_by_id(db: AsyncSession, coop_group_id: str) -> Optional[CooperativeGroup]:
        try:
            stmt = select(CooperativeGroup).where(CooperativeGroup.id == coop_group_id)
            result = await db.execute(stmt)
            coop_group = result.scalars().first()
        except Exception as e:
            logger.logger.error(e)
            raise e
        return coop_group

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
            logger.logger.error(e)
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
            logger.logger.error(e)
            raise e

        return coop_group
