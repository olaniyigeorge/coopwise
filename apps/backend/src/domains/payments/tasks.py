import asyncio

from sqlalchemy import select

from src.domains.cooperatives.models.cooperative import CoopCooperative
from src.domains.payments.service import PayoutService
from src.infra.celery.app import celery_app
from src.infra.db.database import db_manager
from src.shared.utils.logger import logger


@celery_app.task(name="payments.sweep_due_payouts")
def sweep_due_payouts():
    """Pay cooperatives whose rules say the round pays itself and the pot is full."""
    asyncio.run(_sweep_due_payouts())


async def _sweep_due_payouts() -> None:
    async with db_manager.get_session() as session:
        rows = await session.execute(
            select(CoopCooperative.id).where(CoopCooperative.status == "active")
        )
        group_ids = list(rows.scalars().all())

    for group_id in group_ids:
        async with db_manager.get_session() as session:
            try:
                paid = await PayoutService.dispatch_payout(
                    session, group_id, automatic=True
                )
                if paid:
                    logger.info(
                        "Automatic payout created %s record(s) for group %s",
                        len(paid),
                        group_id,
                    )
            except Exception:
                logger.exception("Payout sweep failed for group %s", group_id)
