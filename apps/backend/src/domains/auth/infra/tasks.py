from __future__ import annotations

from uuid import UUID

from src.infra.celery.app import celery_app
from src.shared.utils.logger import logger

@celery_app.task(
    name="auth.provision_wallet",
    bind=True,
    max_retries=5,
    default_retry_delay=30,
    ignore_result=True,
)
def provision_wallet_task(self, user_id_str: str, platform_jwt: str) -> None:
    """Sync Celery entrypoint — bridges to the async adapter + repo update.
    Retries on failure (network blip, Crossmint transient error) up to
    max_retries; a final failure is logged, not raised loudly, since a
    user without a provisioned wallet yet is a degraded-but-functional
    state (see User.flow_address being nullable), not a broken account."""
    import asyncio

    async def _run() -> None:
        from config import AppConfig as config
        from src.domains.auth.infra.crossmint_wallet_client import CrossmintWalletClient
        from src.domains.auth.infra.sqlalchemy_user_repository import (
            SqlAlchemyUserRepository,
        )
        from src.infra.db.database import db_manager

        user_id = UUID(user_id_str)
        provider = CrossmintWalletClient(
            server_api_key=config.CROSSMINT_SERVER_API_KEY,
            chain=config.CROSSMINT_CHAIN,
        )

        async with db_manager.get_session() as db:
            repo = SqlAlchemyUserRepository(db)
            user = await repo.get_by_id(user_id)
            if user is None:
                logger.error(f"[provision_wallet_task] user {user_id} not found")
                return
            if user.flow_address:
                return  # already provisioned — idempotent no-op (e.g. retried task)

            logger.info(f"[provision_wallet_task] provisioning wallet for {user_id}")
            address = await provider.create_wallet(user_id, user.email, )
            user.flow_address = address
            user.wallet_provider = "crossmint"
            await repo.update(user)
            logger.info(f"[provision_wallet_task] wallet provisioned for {user_id}: {address}")

    try:
        asyncio.run(_run())
    except Exception as e:
        logger.error(f"[provision_wallet_task] attempt failed for {user_id_str}: {e}")
        raise self.retry(exc=e)