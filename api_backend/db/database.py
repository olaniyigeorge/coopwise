import databases
import sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from app.core.config import config


Base = declarative_base()

metadata = sqlalchemy.MetaData()


async_engine = create_async_engine(
    url=config.DATABASE_URL ,
)

AsyncSessionLocal = async_sessionmaker(bind=async_engine, class_=AsyncSession, expire_on_commit=False)

database = databases.Database(
    config.DATABASE_URL, 
    force_rollback=True if config.ENV == "dev" else False,
)
 
# Create all tables
async def init_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print(f"\n-> DB tables initialized \n")







# --- Test Setup ---

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_async_db_engine = create_async_engine(
    url=config.TEST_DATABASE_URL,
)

TestAsyncSessionLocal = async_sessionmaker(bind=test_async_db_engine, class_=AsyncSession, expire_on_commit=False)


