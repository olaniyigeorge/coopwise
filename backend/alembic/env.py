from logging.config import fileConfig

from sqlalchemy import engine_from_config, make_url
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy import pool
from urllib.parse import unquote
from alembic import context

from config import AppConfig

from db.database import Base
from db.models.cooperative_group import *
from db.models.user import *
from db.models.activity_model import *
from db.models.ai_chat_model import *
from db.models.contribution_model import *
from db.models.membership import *
from db.models.notifications import *
from db.models.feedback_model import *
from db.models.wallet_models import *
from db.models.ai_insight import *

print("Registered tables:", Base.metadata.tables.keys())


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Assume this is your async DB URL from env or config
raw_db_url  = AppConfig.DATABASE_URL 

# Replace only the driver part from 'asyncpg' to 'psycopg2'
sync_db_url = raw_db_url.replace("postgresql+asyncpg", "postgresql")


print(f"\nraw_db_url: {raw_db_url}\n")
print(f"\nsync_db_url: {sync_db_url}\n")


# Disable configparser interpolation
config.config_ini_section = "alembic"
# Update the config with the dynamically determined database URL
config.set_main_option("sqlalchemy.url", sync_db_url)


# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
