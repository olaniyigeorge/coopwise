import asyncio

from config import AppConfig as config
from sqlalchemy import select

from src.infra.db.database import db_manager

# Side-effect import: register every model so relationships resolve.
from src.infra.db import all_models  # noqa: F401
from src.domains.cooperatives.models.goal_category_seed import GOAL_CATEGORY_SEED
from src.domains.cooperatives.models.goals import CoopGoalCategory


async def main():
    db_manager.initialize(config.DATABASE_URL)
    async with db_manager.get_session() as session:
        existing = await session.execute(select(CoopGoalCategory.code))
        existing_codes = {row[0] for row in existing}
        for row in GOAL_CATEGORY_SEED:
            if row["code"] not in existing_codes:
                session.add(CoopGoalCategory(**row))
    await db_manager.close()


if __name__ == "__main__":
    asyncio.run(main())
