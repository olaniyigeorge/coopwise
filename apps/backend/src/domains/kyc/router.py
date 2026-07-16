import base64
import json
from typing import Optional
from uuid import UUID

from redis import Redis

from src.shared.utils.logger import logger
from src.domains.auth.schemas import AuthenticatedUser
from src.shared.ratelimit.limiter import rate_limit
from src.domains.kyc.audit_service import KYCAuditService
from src.domains.kyc.tasks import process_identity_submission
from src.shared.idempotency.idempotency import IdempotencyGuard, require_idempotency_key
from src.shared.security.webhook_signing import verify_hmac_signature
import filetype  
from fastapi import APIRouter, Depends, File, Form, HTTPException, Header, Request, UploadFile, status

from config import AppConfig as config
from src.api.middlewares.dependencies import get_current_admin_user, get_current_user
from src.infra.cache.redis_client import get_redis
from src.domains.kyc.exceptions import (
    KYCNotFoundError, KYCAlreadyVerifiedError, InvalidKYCStateTransitionError,
    StepAlreadyApprovedError, IdentityVerificationFailedError, BankAccountNameMismatchError,
)
from src.domains.kyc.models import KYCStepStatus, KYCStepType, KYCIdDocumentType
from src.domains.kyc.service import (
    KYCService, PersonalInfoInput, ContactInfoInput, IdentityInput, BankingInfoInput,
)
from src.domains.kyc.schemas import (
    PersonalInfoRequest, ContactInfoRequest, BankingInfoRequest,
    RejectStepRequest, FinalizeRejectRequest,
    KYCStatusResponse, KYCSummaryResponse, StartKYCResponse, StepSummary,
)

# --- adjust these to your actual DI/auth wiring (mirrors your auth domain pattern) ---

from src.domains.kyc.dependencies import get_kyc_audit_service, get_kyc_service


router = APIRouter(prefix="/api/v1/kyc", tags=["KYC"])

_EXCEPTION_STATUS_MAP = {
    KYCNotFoundError: status.HTTP_404_NOT_FOUND,
    KYCAlreadyVerifiedError: status.HTTP_409_CONFLICT,
    InvalidKYCStateTransitionError: status.HTTP_409_CONFLICT,
    StepAlreadyApprovedError: status.HTTP_409_CONFLICT,
    IdentityVerificationFailedError: status.HTTP_422_UNPROCESSABLE_ENTITY,
    BankAccountNameMismatchError: status.HTTP_422_UNPROCESSABLE_ENTITY,
}


def _raise_mapped(exc: Exception):
    for exc_type, http_status in _EXCEPTION_STATUS_MAP.items():
        if isinstance(exc, exc_type):
            raise HTTPException(
                status_code=http_status,
                detail={
                    "message": str(exc),
                    **getattr(exc, "to_dict", lambda: {})(),
                },
            ) from exc

    raise


def _current_step(kyc) -> Optional[KYCStepType]:
    for step_type, record in [(KYCStepType.personal_info, kyc.personal_info),
                               (KYCStepType.contact_info, kyc.contact_info),
                               (KYCStepType.identity_verification, kyc.identity_verification),
                               (KYCStepType.banking_info, kyc.banking_info)]:
        if record is None or record.status not in (KYCStepStatus.submitted, KYCStepStatus.approved):
            return step_type
    return None

def _build_summary(kyc) -> KYCSummaryResponse:
    step_fields = [
        (KYCStepType.personal_info, kyc.personal_info),
        (KYCStepType.contact_info, kyc.contact_info),
        (KYCStepType.identity_verification, kyc.identity_verification),
        (KYCStepType.banking_info, kyc.banking_info),
    ]
    steps = []
    submitted_count = approved_count = rejected_count = 0
    for step_type, record in step_fields:
        if record is None:
            steps.append(StepSummary(step=step_type, status="pending", submitted_at=None))
            continue
        steps.append(StepSummary.model_validate(record | {"step": step_type}) if isinstance(record, dict)
                     else StepSummary(step=step_type, status=record.status,
                                      submitted_at=record.submitted_at,
                                      rejection_reason=record.rejection_reason))
        if record.status.value in ("submitted", "approved"):
            submitted_count += 1
        if record.status.value == "approved":
            approved_count += 1
        if record.status.value == "rejected":
            rejected_count += 1

    return KYCSummaryResponse(
        kyc_id=kyc.id,
        overall_status=kyc.status,
        current_step=_current_step(kyc),
        submitted_count=submitted_count,
        approved_count=approved_count,
        rejected_count=rejected_count,
        steps=steps,
        submitted_at=kyc.submitted_at,
        reviewed_at=kyc.reviewed_at,
        verified_at=kyc.verified_at,
    )


# ---------- User-facing ----------

@router.post("/start", response_model=StartKYCResponse)
async def start_kyc(
    user=Depends(get_current_user),
    service: KYCService = Depends(get_kyc_service),
):
    try:
        kyc = await service.start(user.id)
    except Exception as exc:
        _raise_mapped(exc)
    return StartKYCResponse.model_validate(kyc)


@router.get("/status", response_model=KYCStatusResponse)
async def get_kyc_status(
    user=Depends(get_current_user),
    service: KYCService = Depends(get_kyc_service),
):
    try:
        kyc = await service.get_status(user.id)
    except Exception as exc:
        _raise_mapped(exc)
    return KYCStatusResponse.model_validate(kyc)


@router.get("/summary", response_model=KYCSummaryResponse)
async def get_kyc_summary(
    user=Depends(get_current_user),
    service: KYCService = Depends(get_kyc_service),
):
    """Dashboard progress overview — N/4 submitted, N/4 approved, N/4 rejected."""
    try:
        kyc = await service.get_status(user.id)
    except Exception as exc:
        _raise_mapped(exc)
    return _build_summary(kyc)


@router.post("/personal-info", status_code=status.HTTP_204_NO_CONTENT)
async def submit_personal_info(
    payload: PersonalInfoRequest,
    user=Depends(get_current_user),
    service: KYCService = Depends(get_kyc_service),
):
    try:
        await service.submit_personal_info(
            user.id,
            PersonalInfoInput(
                legal_full_name=payload.legal_full_name,
                date_of_birth=payload.date_of_birth,
                nationality=payload.nationality,
                employment_status=payload.employment_status.value,
                source_of_funds=payload.source_of_funds.value,
                income_currency=payload.income_currency,
                gender=payload.gender,
                occupation_or_business_type=payload.occupation_or_business_type,
                monthly_income_range=payload.monthly_income_range,
            ),
        )
    except Exception as exc:
        _raise_mapped(exc)


@router.post("/contact-info", status_code=status.HTTP_204_NO_CONTENT)
async def submit_contact_info(
    payload: ContactInfoRequest,
    user=Depends(get_current_user),
    service: KYCService = Depends(get_kyc_service),
):
    try:
        await service.submit_contact_info(user.id, ContactInfoInput(**payload.model_dump()))
    except Exception as exc:
        _raise_mapped(exc)


_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
_ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime"}
_MAX_IMAGE_BYTES = 8 * 1024 * 1024
_MAX_VIDEO_BYTES = 50 * 1024 * 1024



async def _read_validated(file: UploadFile, allowed_types: set[str], max_bytes: int) -> bytes:
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large")
    if len(content) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty file")
    kind = filetype.guess(content)
    if kind is None or kind.mime not in allowed_types:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"Unsupported type: {kind}")
    return content

# TODO: malware/AV scan before files his object storage
@router.post(
    "/identity",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(rate_limit(limit=5, window_seconds=3600, scope="kyc:identity"))],
)
async def submit_identity(
    document_type: KYCIdDocumentType = Form(...),
    document_number: str = Form(...),
    document_image: UploadFile = File(...),
    selfie_image: UploadFile = File(...),
    video: UploadFile | None = File(None),
    idempotency_key: str = Depends(require_idempotency_key),
    user: AuthenticatedUser =Depends(get_current_user),
    redis: Redis = Depends(get_redis),
    service: KYCService = Depends(get_kyc_service),
):
    guard = IdempotencyGuard(redis, scope="kyc:identity")
    acquired = await guard.start(
        user.id,
        idempotency_key,
    )

    if not acquired:
        previous = await guard.get_result(
            user.id,
            idempotency_key,
        )

        if previous:
            if previous["status"] == "completed":
                return previous["response"]

            raise HTTPException(
                status_code=409,
                detail="Request is currently processing",
            )

        raise HTTPException(
            status_code=409,
            detail="Request is currently processing",
        )

    doc_bytes = await _read_validated(document_image, _ALLOWED_IMAGE_TYPES, _MAX_IMAGE_BYTES)
    selfie_bytes = await _read_validated(selfie_image, _ALLOWED_IMAGE_TYPES, _MAX_IMAGE_BYTES)
    video_bytes = video_content_type = None
    if video is not None:
        video_bytes = await _read_validated(video, _ALLOWED_VIDEO_TYPES, _MAX_VIDEO_BYTES)
        video_content_type = video.content_type

    kyc = await service.begin_identity_submission(user.id)

    logger.info(
        "Queueing identity task for kyc=%s",
        kyc.id,
    )
    process_identity_submission.delay(
        kyc_id=str(kyc.id),
        document_type=document_type.value,
        document_number=document_number,
        document_bytes_b64=base64.b64encode(doc_bytes).decode(),
        document_content_type=document_image.content_type,
        selfie_bytes_b64=base64.b64encode(selfie_bytes).decode(),
        selfie_content_type=selfie_image.content_type,
        video_bytes_b64=base64.b64encode(video_bytes).decode() if video_bytes else None,
        video_content_type=video_content_type,
        idempotency_key=idempotency_key,
    )

    response = {
        "status": "processing",
        "kyc_id": str(kyc.id),
    }

    await guard.complete(
        user.id,
        idempotency_key,
        response,
    )

    return response

@router.post(
    "/banking-info",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(rate_limit(limit=5, window_seconds=3600, scope="kyc:banking"))],
)
async def submit_banking_info(
    payload: BankingInfoRequest,
    user=Depends(get_current_user),
    service: KYCService = Depends(get_kyc_service),
):
    try:
        await service.submit_banking_info(user.id, BankingInfoInput(**payload.model_dump()))
    except Exception as exc:
        _raise_mapped(exc)


# ---------- Provider webhook (no auth — verify via signature/shared secret instead) ----------

@router.post("/webhook/identity", status_code=status.HTTP_204_NO_CONTENT)
async def identity_webhook(
    request: Request,
    service: KYCService = Depends(get_kyc_service),
):
    raw_body = await request.body()
    signature = request.headers.get("X-Provider-Signature")
    if not verify_hmac_signature(raw_body, signature, config.KYC_WEBHOOK_SECRET):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid signature")

    payload = json.loads(raw_body)
    reference_id = payload.get("reference_id")
    if not reference_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing reference_id")
    await service.handle_identity_webhook(reference_id, payload)

# ---------- Admin / compliance ----------
@router.post("/admin/{kyc_id}/steps/{step}/approve", status_code=status.HTTP_204_NO_CONTENT)
async def approve_step(
    kyc_id: UUID, step: KYCStepType, request: Request,
    admin=Depends(get_current_admin_user),
    service: KYCService = Depends(get_kyc_service),
    audit: KYCAuditService = Depends(get_kyc_audit_service),
):
    try:
        await service.approve_step(kyc_id, step)
    except Exception as exc:
        _raise_mapped(exc)
    await audit.log(
        kyc_id=kyc_id, admin_id=admin.id, action="approve_step", step=step.value,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/admin/{kyc_id}/steps/{step}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_step(
    kyc_id: UUID, step: KYCStepType, payload: RejectStepRequest, request: Request,
    admin=Depends(get_current_admin_user),
    service: KYCService = Depends(get_kyc_service),
    audit: KYCAuditService = Depends(get_kyc_audit_service),
):
    try:
        await service.reject_step(kyc_id, step, payload.reason)
    except Exception as exc:
        _raise_mapped(exc)
    await audit.log(
        kyc_id=kyc_id, admin_id=admin.id, action="reject_step", step=step.value,
        reason=payload.reason, ip_address=request.client.host,
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/admin/{kyc_id}/finalize/verify", status_code=status.HTTP_204_NO_CONTENT)
async def finalize_verified(
    kyc_id: UUID,
    _admin=Depends(get_current_admin_user),
    service: KYCService = Depends(get_kyc_service),
):
    try:
        await service.finalize_verified(kyc_id)
    except Exception as exc:
        _raise_mapped(exc)


@router.post("/admin/{kyc_id}/finalize/reject", status_code=status.HTTP_204_NO_CONTENT)
async def finalize_rejected(
    kyc_id: UUID,
    payload: FinalizeRejectRequest,
    _admin=Depends(get_current_admin_user),
    service: KYCService = Depends(get_kyc_service),
):
    try:
        await service.finalize_rejected(kyc_id, payload.reason)
    except Exception as exc:
        _raise_mapped(exc)