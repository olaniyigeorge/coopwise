from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from src.infra.db import all_models  # noqa: F401  (register every mapper)
from src.domains.cooperatives.models.goal_category_seed import GOAL_CATEGORY_SEED
from src.domains.cooperatives.models.goals import (
    CoopBeneficiaryPattern,
    CoopGoalCategory,
)
from src.domains.cooperatives.models.seed import BENEFICIARY_PATTERN_SEED
from src.infra.db.database import db_manager
from src.shared.utils.logger import logger


async def seed_system_catalog() -> None:
    """Ensure the controlled catalog tables have their system rows.

    Idempotent and safe to run on every boot: rows are matched by ``code`` and
    existing ones are left untouched, so this repairs an empty database
    without overwriting anything an operator has changed.

    This exists because the catalog endpoint returns rows verbatim — if the
    seed never ran, the "Goal category" picker in the goal wizard is empty and
    the form can never be submitted.
    """
    try:
        async with db_manager.get_session() as session:
            existing_patterns = set(
                (await session.execute(select(CoopBeneficiaryPattern.code))).scalars()
            )
            added_patterns = 0
            for row in BENEFICIARY_PATTERN_SEED:
                if row["code"] not in existing_patterns:
                    session.add(CoopBeneficiaryPattern(**row))
                    added_patterns += 1

            existing_categories = set(
                (await session.execute(select(CoopGoalCategory.code))).scalars()
            )
            added_categories = 0
            for row in GOAL_CATEGORY_SEED:
                if row["code"] not in existing_categories:
                    session.add(CoopGoalCategory(**row))
                    added_categories += 1
    except IntegrityError:
        # Two instances booting at once can both see the empty table. The
        # loser of that race rolls back and keeps serving; the winner's rows
        # are already there, so this is not worth failing startup over.
        logger.warning("System catalog seed lost a race with another instance; skipping")
        return

    if added_patterns or added_categories:
        logger.info(
            "Seeded system catalog: %s beneficiary patterns, %s goal categories",
            added_patterns,
            added_categories,
        )
