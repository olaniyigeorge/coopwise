# conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
import pytest_asyncio
from sqlalchemy import StaticPool
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator

from main import app as fastapi_app
from db.database import Base, DatabaseManager
from db.dependencies import get_async_db_session

# Global test database manager
test_db_manager: DatabaseManager = None


async def override_get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Override function for database dependency in tests"""
    if not test_db_manager:
        raise RuntimeError("Test database manager not initialized")

    async with test_db_manager.get_session() as session:
        yield session


@pytest_asyncio.fixture(scope="session")
async def setup_test_database():
    """Session-scoped fixture to set up test database"""
    global test_db_manager

    # Initialize test database manager
    test_db_manager = DatabaseManager()
    test_db_manager.initialize(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    # Create tables
    await test_db_manager.create_tables()

    # Override the dependency
    fastapi_app.dependency_overrides[get_async_db_session] = (
        override_get_async_db_session
    )

    yield test_db_manager

    # Cleanup
    await test_db_manager.close()
    # Clear dependency overrides
    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_db_session(setup_test_database):
    """Test database session fixture"""
    async with setup_test_database.get_session() as session:
        yield session


@pytest_asyncio.fixture(autouse=True)
async def reset_test_db(setup_test_database):
    """Reset test database for each test function"""
    # Drop and recreate all tables
    async with setup_test_database.engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture
async def async_client(setup_test_database):
    """Async client for FastAPI routes"""
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# Alternative approach if you prefer function-scoped database
@pytest_asyncio.fixture
async def fresh_test_db():
    """Function-scoped test database - creates a new DB for each test"""
    manager = DatabaseManager()
    manager.initialize(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    await manager.create_tables()

    # Temporarily override dependency
    original_override = fastapi_app.dependency_overrides.get(get_async_db_session)

    async def temp_override():
        async with manager.get_session() as session:
            yield session

    fastapi_app.dependency_overrides[get_async_db_session] = temp_override

    yield manager

    # Cleanup
    await manager.close()

    # Restore original override or clear
    if original_override:
        fastapi_app.dependency_overrides[get_async_db_session] = original_override
    else:
        fastapi_app.dependency_overrides.pop(get_async_db_session, None)
