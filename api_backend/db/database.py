import databases
import asyncio
import sqlalchemy
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.declarative import declarative_base


from config import config


# SQLAlchemy Base class for declarative models
Base = declarative_base()


# Metadata for table definitions
metadata = sqlalchemy.MetaData()

# Define the engine
async_engine = create_async_engine(
    url=config.DATABASE_URL,
    #echo=True,
)


# Async session maker
AsyncSessionLocal = async_sessionmaker(bind=async_engine, class_=AsyncSession, expire_on_commit=False)

# Asynchronous database instance
database = databases.Database(
    config.DATABASE_URL #force_rollback=config.DB_FORCE_ROLLBACK
)
 
# Create all tables
async def init_db():
    async with async_engine.begin() as conn:
        print(f"\nCreating db tables...\n")
        await conn.run_sync(Base.metadata.create_all)

