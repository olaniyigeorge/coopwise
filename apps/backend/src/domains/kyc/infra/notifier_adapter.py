from src.domains.kyc.models import KYCStatus, KYCStepType, KYCVerification
from src.domains.notifications.models import EventType, NotificationType
from src.domains.notifications.schemas import NotificationCreate
from src.domains.notifications.service import NotificationService
from src.shared.utils.logger import logger


class NotificationServiceKYCNotifier:
    def __init__(self, db=None):
        self._db = db

    async def _send(self, *, verification: KYCVerification, title: str, message: str, notification_type: NotificationType, key: str) -> None:
        if self._db is None:
            return
        try:
            await NotificationService.create_and_push_notification_to_user(
                NotificationCreate(
                    user_id=verification.user_id,
                    title=title,
                    message=message,
                    event_type=EventType.system,
                    type=notification_type,
                    entity_url="/dashboard/kyc",
                    idempotency_key=key,
                ),
                self._db,
            )
        except Exception:
            logger.exception("Could not create KYC notification for %s", verification.id)

    async def notify_kyc_status_transition(
        self,
        verification: KYCVerification,
        previous_status: KYCStatus,
        new_status: KYCStatus,
    ) -> None:
        messages = {
            KYCStatus.in_progress: (
                "KYC reopened",
                "Your KYC application is open for updates. Complete the requested details to continue.",
                NotificationType.info,
            ),
            KYCStatus.pending_review: (
                "KYC submitted for review",
                "Your KYC details are complete and have been submitted for review.",
                NotificationType.info,
            ),
            KYCStatus.verified: (
                "KYC verified",
                "Your identity and account details have been verified successfully.",
                NotificationType.success,
            ),
            KYCStatus.rejected: (
                "KYC needs attention",
                "Your KYC application was rejected. Review the requested changes and resubmit.",
                NotificationType.error,
            ),
            KYCStatus.expired: (
                "KYC verification expired",
                "Your KYC verification has expired. Please update your details to continue.",
                NotificationType.warning,
            ),
        }
        content = messages.get(new_status)
        if not content or previous_status == new_status:
            return
        title, message, notification_type = content
        await self._send(
            verification=verification,
            title=title,
            message=message,
            notification_type=notification_type,
            key=f"kyc:status:{verification.id}:{previous_status.value}:{new_status.value}",
        )

    async def notify_kyc_step_rejected(
        self,
        verification: KYCVerification,
        step: KYCStepType,
        reason: str,
    ) -> None:
        await self._send(
            verification=verification,
            title="KYC step needs attention",
            message=f"Your {step.value.replace('_', ' ')} step needs attention: {reason}",
            notification_type=NotificationType.error,
            key=f"kyc:step-rejected:{verification.id}:{step.value}:{reason}",
        )
