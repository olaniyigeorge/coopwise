import pytest
from httpx import AsyncClient, ASGITransport

from main import app as fastapi_app
from db.database import Base, test_async_db_engine, TestAsyncSessionLocal

from db.dependencies import (
    get_async_db_session, 
    override_get_async_db_session
)

# Override the DB dependency before tests start
fastapi_app.dependency_overrides[get_async_db_session] = override_get_async_db_session


@pytest.fixture()
async def async_session():
    async with TestAsyncSessionLocal() as session:
        yield session

# Reset test database for each test function
@pytest.fixture(scope="function", autouse=True)
async def reset_test_db():
    async with test_async_db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield  # no teardown needed for in-memory SQLite


# Async client for FastAPI routes
@pytest.fixture()
async def async_client():
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
