# src/domains/kyc/tasks.py
import asyncio
import base64
from uuid import UUID

from src.infra.celery.app import celery_app
from src.domains.kyc.dependencies import build_kyc_service
from src.domains.kyc.service import IdentityInput
from src.domains.kyc.exceptions import IdentityVerificationFailedError, TransientProviderError
from src.shared.idempotency.idempotency import acquire_idempotency_lock


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def process_identity_submission(self, *, kyc_id, document_type, document_number,
                                  document_bytes_b64, document_content_type,
                                  selfie_bytes_b64, selfie_content_type,
                                  video_bytes_b64, video_content_type, idempotency_key):
    if not acquire_idempotency_lock(f"kyc:identity:task:{idempotency_key}"):
        return  # already processed or currently in-flight — safe no-op

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
        raise self.retry(exc=exc)
    except IdentityVerificationFailedError:
        pass  # service already recorded the rejection — this isn't a task failure