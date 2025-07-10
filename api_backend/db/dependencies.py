from typing import Annotated, AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager

from db.database import AsyncSessionLocal, TestAsyncSessionLocal


# Dependency for asynchronous session
async def get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async_db_session_dependency = Annotated[AsyncSession, Depends(get_async_db_session)]


async def override_get_async_db_session()-> AsyncGenerator[AsyncSession, None]:
    async with TestAsyncSessionLocal() as session:
        yield session


test_async_db_session_dependency = Annotated[AsyncSession, Depends(override_get_async_db_session)]
