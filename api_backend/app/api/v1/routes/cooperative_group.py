from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, List

from app.schemas.cooperative_group import CoopGroupCreate, CoopGroupDetails, CooperativeStatus
from db.dependencies import get_async_db_session
from app.services.group_service import CooperativeGroupService


router = APIRouter(
    prefix="/api/v1/cooperatives", 
    tags=["Cooperative Groups"]
    )


@router.post("/create", response_model=CoopGroupDetails, status_code=status.HTTP_201_CREATED)
async def create_cooperative_group(
    coop_data: CoopGroupCreate,
    # user = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session)
):
    return await CooperativeGroupService.create_coop(coop_data, db)


@router.get("/", response_model=List[CoopGroupDetails])
async def list_cooperative_groups(
        db: AsyncSession = Depends(get_async_db_session), 
        skip: int = 0, limit: int = 10
    ):
    """
        Fetch a list of cooperative groups with optional pagination.
    """

    return await CooperativeGroupService.get_coop_groups(
        db, skip=skip, limit=limit)
    


@router.get("/{coop_id}", response_model=CoopGroupDetails)
async def get_interview(coop_id: str, db: AsyncSession = Depends(get_async_db_session)):
    """
        Fetch a single cooperative group by ID.
    """
    interview = await CooperativeGroupService.get_coop_group_by_id(db, coop_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Cooperative group not found")
    return interview