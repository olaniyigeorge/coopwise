from datetime import date
from uuid import uuid4

import pytest

from config import AppConfig as config
from src.domains.kyc.exceptions import (
    BankAccountNameMismatchError,
    IdentityVerificationFailedError,
    InvalidKYCStateTransitionError,
    KYCAlreadyVerifiedError,
    KYCNotFoundError,
    StepAlreadyApprovedError,
)
from src.domains.kyc.infra.bank_verification_provider import MockBankVerificationProvider
from src.domains.kyc.infra.notifier_adapter import NotificationServiceKYCNotifier
from src.domains.kyc.infra.user_kyc_flag import UserKYCFlager
from src.domains.kyc.models import KYCStatus, KYCStepStatus, KYCStepType
from src.domains.kyc.repositories import (
    SQLAlchemyKYCAuditRepository,
    SQLAlchemyKYCRepository,
)
from src.domains.kyc.schemas import (
    BankingInfoInput,
    ContactInfoInput,
    IdentityInput,
    IdentityVerificationResult,
    PersonalInfoInput,
)
from src.domains.kyc.service import KYCService
from src.infra.security.field_encryptor import FieldEncryptor
from src.domains.users.models import User


class FakeIdentityProvider:
    """Controllable stand-in for the real provider — the shipped
    MockIdentityVerificationProvider always succeeds, so it can't exercise
    the rejection path."""

    def __init__(self, *, success=True, requires_manual_review=True):
        self.success = success
        self.requires_manual_review = requires_manual_review

    async def verify_identity(self, **kwargs) -> IdentityVerificationResult:
        return IdentityVerificationResult(
            success=self.success,
            reference_id=str(uuid4()),
            raw_response={"provider": "fake"},
            requires_manual_review=self.requires_manual_review,
            liveness_score=90.0,
            liveness_check_passed=self.success,
        )


class FakeObjectStorage:
    async def upload(self, key: str, content: bytes, content_type: str) -> str:
        return key


def _build_service(db_session, *, identity_success=True, identity_manual_review=True):
    return KYCService(
        repository=SQLAlchemyKYCRepository(db_session),
        audit_repository=SQLAlchemyKYCAuditRepository(db_session),
        encryptor=FieldEncryptor(config.SECRET_ENCRYPTION_KEY),
        identity_provider=FakeIdentityProvider(
            success=identity_success, requires_manual_review=identity_manual_review
        ),
        bank_provider=MockBankVerificationProvider(),
        storage=FakeObjectStorage(),
        user_flag_port=UserKYCFlager(db_session),
        notifier=NotificationServiceKYCNotifier(),
    )


async def _make_user(db_session) -> User:
    user = User(
        id=uuid4(),
        username=f"user_{uuid4().hex[:8]}",
        email=f"{uuid4().hex[:8]}@coopwise.example",
        full_name="Test KYC User",
    )
    db_session.add(user)
    await db_session.flush()
    return user


PERSONAL_INFO = PersonalInfoInput(
    # Matches (fuzzily) the fixed name MockBankVerificationProvider always
    # resolves to, so the "banking succeeds cleanly" tests actually hit the
    # success path rather than a spurious name mismatch.
    legal_full_name="Olaniyi George",
    date_of_birth=date(1990, 1, 1),
    nationality="NG",
    employment_status="employed",
    source_of_funds="salary",
    income_currency="NGN",
)
CONTACT_INFO = ContactInfoInput(
    residential_address="1 Main St", city="Lagos", state="Lagos", postal_code="100001",
    country="NG",
)
IDENTITY = IdentityInput(
    document_type="passport",
    document_number="A1234567",
    document_image_bytes=b"doc",
    document_image_content_type="image/png",
    selfie_image_bytes=b"selfie",
    selfie_image_content_type="image/png",
)
BANKING_OK = BankingInfoInput(
    bank_name="Test Bank", bank_code="058", account_number="0123456789",
    account_name="Olaniyi George",
)
BANKING_NAME_MISMATCH = BankingInfoInput(
    bank_name="Test Bank", bank_code="058", account_number="0123456789",
    account_name="Someone Completely Different",
)
BANKING_UNRESOLVABLE = BankingInfoInput(
    bank_name="Test Bank", bank_code="058", account_number="0000000000",
    account_name="Olaniyi George",
)


async def _drive_to_pending_review(service, user):
    """finalize_verified/finalize_rejected only allow pending_review -> * —
    get a KYC record there via the real submission flow rather than
    asserting an illegal shortcut transition."""
    await service.submit_personal_info(user.id, PERSONAL_INFO)
    await service.submit_contact_info(user.id, CONTACT_INFO)
    await service.submit_identity(user.id, IDENTITY)
    await service.submit_banking_info(user.id, BANKING_OK)
    return await service.get_status(user.id)


# --------------------------------------------------------------------------
# State machine basics
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_start_creates_record_and_transitions_to_in_progress(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session)

    kyc = await service.start(user.id)

    assert kyc.status == KYCStatus.in_progress


@pytest.mark.asyncio
async def test_get_status_raises_when_no_record(db_session):
    service = _build_service(db_session)
    with pytest.raises(KYCNotFoundError):
        await service.get_status(uuid4())


@pytest.mark.asyncio
async def test_submit_requires_start_first(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session)

    with pytest.raises(KYCNotFoundError):
        await service.submit_personal_info(user.id, PERSONAL_INFO)


# --------------------------------------------------------------------------
# _require_editable guard
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cannot_edit_verified_kyc(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session)
    await service.start(user.id)
    kyc = await _drive_to_pending_review(service, user)
    await service.finalize_verified(kyc.id)

    with pytest.raises(KYCAlreadyVerifiedError):
        await service.submit_personal_info(user.id, PERSONAL_INFO)


@pytest.mark.asyncio
async def test_cannot_overwrite_an_approved_step(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session)
    kyc = await service.start(user.id)
    await service.submit_personal_info(user.id, PERSONAL_INFO)
    await service.approve_step(kyc.id, KYCStepType.personal_info)

    with pytest.raises(StepAlreadyApprovedError):
        await service.submit_personal_info(user.id, PERSONAL_INFO)


@pytest.mark.asyncio
async def test_touching_any_step_reopens_a_rejected_kyc(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session)
    kyc = await service.start(user.id)
    await service.submit_personal_info(user.id, PERSONAL_INFO)
    await service.reject_step(kyc.id, KYCStepType.personal_info, reason="bad doc")

    reloaded = await service.get_status(user.id)
    assert reloaded.status == KYCStatus.rejected

    await service.submit_contact_info(user.id, CONTACT_INFO)

    reloaded = await service.get_status(user.id)
    assert reloaded.status == KYCStatus.in_progress


# --------------------------------------------------------------------------
# Identity submission
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_submit_identity_failure_raises_and_marks_step_rejected(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session, identity_success=False)
    await service.start(user.id)

    with pytest.raises(IdentityVerificationFailedError):
        await service.submit_identity(user.id, IDENTITY)

    kyc = await service.get_status(user.id)
    assert kyc.identity_verification.status == KYCStepStatus.rejected


@pytest.mark.asyncio
async def test_submit_identity_success_with_manual_review_routes_to_submitted(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session, identity_success=True, identity_manual_review=True)
    await service.start(user.id)

    await service.submit_identity(user.id, IDENTITY)

    kyc = await service.get_status(user.id)
    assert kyc.identity_verification.status == KYCStepStatus.submitted


@pytest.mark.asyncio
async def test_submit_identity_success_without_manual_review_auto_approves(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session, identity_success=True, identity_manual_review=False)
    await service.start(user.id)

    await service.submit_identity(user.id, IDENTITY)

    kyc = await service.get_status(user.id)
    assert kyc.identity_verification.status == KYCStepStatus.approved


# --------------------------------------------------------------------------
# Banking info — name-match policy
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_submit_banking_info_requires_personal_info_first(db_session):
    """Cross-step validation reads kyc.personal_info.legal_full_name — must
    exist before banking info can be submitted at all."""
    user = await _make_user(db_session)
    service = _build_service(db_session)
    await service.start(user.id)

    with pytest.raises(AttributeError):
        await service.submit_banking_info(user.id, BANKING_OK)


@pytest.mark.asyncio
async def test_submit_banking_info_resolution_failure_raises(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session)
    await service.start(user.id)
    await service.submit_personal_info(user.id, PERSONAL_INFO)

    with pytest.raises(BankAccountNameMismatchError) as exc_info:
        await service.submit_banking_info(user.id, BANKING_UNRESOLVABLE)
    assert exc_info.value.reason == "resolution_failed"


@pytest.mark.asyncio
async def test_submit_banking_info_never_auto_approves_even_on_success(db_session):
    """Deliberate policy: banking always routes to manual review, never
    auto-approved, regardless of how clean the name match is."""
    user = await _make_user(db_session)
    service = _build_service(db_session)
    await service.start(user.id)
    await service.submit_personal_info(user.id, PERSONAL_INFO)

    await service.submit_banking_info(user.id, BANKING_OK)

    kyc = await service.get_status(user.id)
    assert kyc.banking_info.status == KYCStepStatus.submitted


# --------------------------------------------------------------------------
# handle_identity_webhook
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_webhook_for_unknown_reference_is_a_silent_no_op(db_session):
    service = _build_service(db_session)
    # Must not raise.
    await service.handle_identity_webhook("no-such-reference", {"status": "approved"})


# --------------------------------------------------------------------------
# Full happy path to verified, and approve_step's all-four-steps gate
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_approve_step_only_marks_verified_once_all_four_steps_approved(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session, identity_manual_review=False)
    kyc = await service.start(user.id)

    await service.submit_personal_info(user.id, PERSONAL_INFO)
    await service.submit_contact_info(user.id, CONTACT_INFO)
    await service.submit_identity(user.id, IDENTITY)  # auto-approved (no manual review)
    await service.submit_banking_info(user.id, BANKING_OK)  # always "submitted"

    # All four steps submitted/approved -> overall record advances to pending_review.
    reloaded = await service.get_status(user.id)
    assert reloaded.status == KYCStatus.pending_review

    await service.approve_step(kyc.id, KYCStepType.personal_info)
    await service.approve_step(kyc.id, KYCStepType.contact_info)
    reloaded = await service.get_status(user.id)
    assert reloaded.status == KYCStatus.pending_review  # not yet — banking still "submitted"

    # Approving banking_info is the fourth and last step (identity was
    # already auto-approved earlier) — this should flip the whole record.
    await service.approve_step(kyc.id, KYCStepType.banking_info)
    reloaded = await service.get_status(user.id)
    assert reloaded.status == KYCStatus.verified

    user_row = await db_session.get(User, user.id)
    assert user_row.is_kyc_verified is True


@pytest.mark.asyncio
async def test_finalize_verified_sets_user_flag_and_rejects_double_verify(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session)
    await service.start(user.id)
    kyc = await _drive_to_pending_review(service, user)

    await service.finalize_verified(kyc.id)

    reloaded = await service.get_status(user.id)
    assert reloaded.status == KYCStatus.verified
    assert reloaded.verified_at is not None

    user_row = await db_session.get(User, user.id)
    assert user_row.is_kyc_verified is True

    with pytest.raises(KYCAlreadyVerifiedError):
        await service.finalize_verified(kyc.id)


@pytest.mark.asyncio
async def test_finalize_rejected_sets_user_flag_false(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session)
    kyc = await service.start(user.id)

    await service.finalize_rejected(kyc.id, reason="failed manual review")

    reloaded = await service.get_status(user.id)
    assert reloaded.status == KYCStatus.rejected

    user_row = await db_session.get(User, user.id)
    assert user_row.is_kyc_verified is False


# --------------------------------------------------------------------------
# Raw state-machine invariant
# --------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_illegal_transition_raises(db_session):
    user = await _make_user(db_session)
    service = _build_service(db_session)
    kyc = await service.start(user.id)  # now in_progress

    # in_progress -> verified is not an allowed direct transition.
    with pytest.raises(InvalidKYCStateTransitionError):
        await service._transition(kyc, KYCStatus.verified)
