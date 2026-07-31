import asyncio

from src.shared.utils.logger import logger
from src.infra.celery.app import celery_app
from src.infra.emails.deps import build_email_sender
from src.infra.emails.otp_email import render_otp_email
from src.infra.emails.exceptions import EmailSendError



@celery_app.task(
    name="auth.send_otp_email",
    bind=True,
    max_retries=5,
    default_retry_delay=30,
    ignore_result=True,
)
def send_otp_email_task(self, *, identifier: str, code: str, expires_minutes: int = 10) -> None:
    subject, html = render_otp_email(code=code, expires_minutes=expires_minutes)
    sender = build_email_sender()  # fresh factory call — worker is a separate process, no FastAPI DI container here

    try:
        asyncio.run(sender.send(to=identifier, subject=subject, html=html))
    except EmailSendError as e:
        logger.error(f"[send_otp_email_task] attempt {self.request.retries + 1}/5 failed for {identifier}: {e}")
        raise self.retry(exc=e)
    except Exception as e:
        # Anything unexpected (bad recipient format, etc.) — don't retry
        # blindly on errors retrying won't fix.
        logger.error(f"[send_otp_email_task] non-retryable failure for {identifier}: {e}")
        raise