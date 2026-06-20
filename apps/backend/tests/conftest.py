
import os
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.pool import NullPool

from src.infra.db.database import db_manager
from src.infra.db.dependencies import get_async_db_session

"""
Import every model referenced by User's relationship() string names so
SQLAlchemy's mapper registry can resolve them. This mirrors what happens
in the real app: main.py / Base.metadata.create_all() touches every
domain's models module, registering them all before any query runs.
"""
from src.domains.ai_chat import models as _ai_chat_models  # noqa: F401
from src.domains.contributions import models as _contrib_models  # noqa: F401
from src.domains.insights import models as _insights_models  # noqa: F401
from src.domains.memberships import models as _membership_models  # noqa: F401
from src.domains.notifications import models as _notification_models  # noqa: F401
from src.domains.support import models as _support_models  # noqa: F401
from src.domains.users import models as _user_models  # noqa: F401
from src.domains.wallets import models as _wallet_models  # noqa: F401


DATABASE_URL = os.environ["DATABASE_URL"]

@pytest.fixture(scope="session", autouse=True)
def _init_db_manager():
    if not db_manager._is_initialized:
        db_manager.initialize(DATABASE_URL, poolclass=NullPool)
    yield

@pytest_asyncio.fixture
async def db_session():
    """Each test runs inside its own transaction, rolled back at the end."""
    connection = await db_manager.engine.connect()
    trans = await connection.begin()
    session = AsyncSession(bind=connection, expire_on_commit=False)
    try:
        yield session
    finally:
        await session.close()
        await trans.rollback()
        await connection.close()


@pytest_asyncio.fixture
async def async_client(db_session):
    from main import app  # import here, after _init_db_manager has run

    async def override_get_async_db_session():
        yield db_session

    app.dependency_overrides[get_async_db_session] = override_get_async_db_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()