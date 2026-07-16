# src/domains/kyc/tasks.py
import asyncio
import base64
from uuid import UUID

from src.infra.celery.app import celery_app
from src.domains.kyc.service import IdentityInput
from src.domains.kyc.exceptions import IdentityVerificationFailedError, TransientProviderError
from src.shared.idempotency.idempotency import acquire_idempotency_lock
from src.shared.utils.logger import logger
# NOTE: build_kyc_service is intentionally NOT imported at module level —
# see the circular-import chain this used to trigger under the Celery
# entrypoint (kyc.tasks -> kyc.dependencies -> api.middlewares.dependencies
# -> src.api package init -> routers -> kyc.router -> kyc.tasks, still
# mid-import). Importing it inside the task body defers it until the
# module is fully loaded and registered.


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def process_identity_submission(self, *, kyc_id, document_type, document_number,
                                  document_bytes_b64, document_content_type,
                                  selfie_bytes_b64, selfie_content_type,
                                  video_bytes_b64, video_content_type, idempotency_key):
    from src.domains.kyc.dependencies import build_kyc_service

    lock_key = f"kyc:identity:task:{idempotency_key}"
    if not acquire_idempotency_lock(lock_key):
        logger.warning(
            f"[process_identity_submission] skipped kyc={kyc_id} "
            f"— lock '{lock_key}' already held"
        )
        return

    logger.info(f"[process_identity_submission] starting kyc={kyc_id}")
    service = build_kyc_service()
    data = IdentityInput(
        document_type=document_type,
        document_number=document_number,
        document_image_bytes=base64.b64decode(document_bytes_b64),
        document_image_content_type=document_content_type,
        selfie_image_bytes=base64.b64decode(selfie_bytes_b64),
        selfie_image_content_type=selfie_content_type,
        video_bytes=base64.b64decode(video_bytes_b64) if video_bytes_b64 else None,
        video_content_type=video_content_type,
    )
    try:
        asyncio.run(service.complete_identity_submission(UUID(kyc_id), data))
    except TransientProviderError as exc:
        logger.warning(f"[process_identity_submission] transient error kyc={kyc_id}: {exc} — retrying")
        raise self.retry(exc=exc)
    except IdentityVerificationFailedError:
        logger.info(f"[process_identity_submission] rejected (recorded by service) kyc={kyc_id}")