import asyncio

from config import AppConfig as config
from sqlalchemy import select

from src.infra.db.database import db_manager
from src.domains.cooperatives.models.seed import BENEFICIARY_PATTERN_SEED
from src.domains.cooperatives.models.goals import CoopBeneficiaryPattern 


async def main():
    db_manager.initialize(config.DATABASE_URL)
    async with db_manager.get_session() as session:
        existing = await session.execute(select(CoopBeneficiaryPattern.code))
        existing_codes = {row[0] for row in existing}
        for row in BENEFICIARY_PATTERN_SEED:
            if row["code"] not in existing_codes:
                session.add(CoopBeneficiaryPattern(**row))
    await db_manager.close()

if __name__ == "__main__":
    asyncio.run(main())