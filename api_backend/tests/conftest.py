import pytest
from httpx import AsyncClient
from fastapi import FastAPI

from main import app as fastapi_app
from db.database import Base, test_async_db_engine
from db.dependencies import (
    get_async_db_session, 
    override_get_async_db_session
)

# ✅ Override the DB dependency before tests start
fastapi_app.dependency_overrides[get_async_db_session] = override_get_async_db_session


# ✅ Reset test database for each test function
@pytest.fixture(scope="function", autouse=True)
async def reset_test_db():
    async with test_async_db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield  # (no teardown needed for in-memory SQLite)


# ✅ Async client for FastAPI routes
@pytest.fixture()
async def async_client() -> AsyncClient:
    async with AsyncClient(app=fastapi_app, base_url="http://test") as client:
        yield client
