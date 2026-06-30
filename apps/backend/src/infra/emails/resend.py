"""
Shared email-sending infra: Resend in staging/production, logged-only in
development (no SMTP dependency for local dev — see NullEmailSender).

Lives in src/infra/resend because this is a cross-domain capability (auth
OTP emails today; notifications, receipts, etc. will want it later), the
same way src/infra/payments and src/infra/blockchain hold shared
third-party integrations rather than being owned by one domain.

Mirrors the TS version's structure (useResend() env gate, getFromAddress()
domain validation) but drops the Gmail SMTP dev fallback in favor of the
same NullSender pattern already used for OTP SMS/email in the auth domain
(src/domains/auth/infra/otp_senders.py) — one less credential (a Gmail app
password) required just to run the app locally. Add SMTP back later if you
specifically want to see real emails land in an inbox during dev; logging
is enough to unblock OTP-flow testing in the meantime.
"""
from __future__ import annotations

from typing import Optional, Protocol

import resend

from src.shared.utils.logger import logger


class EmailSendError(Exception):
    """Raised when the configured email provider fails to send."""


class EmailSenderPort(Protocol):
    async def send(self, *, to: str, subject: str, html: str) -> None: ...


def _validate_from_address(email: str) -> None:
    domain = email.split("@")[-1].lower() if "@" in email else ""
    if domain in ("gmail.com", "googlemail.com"):
        raise EmailSendError(
            f"EMAIL_FROM cannot be a Gmail address ({email}) when using Resend. "
            "Use an address on a domain verified at https://resend.com/domains."
        )


class ResendEmailSender:
    """Production/staging sender. Requires RESEND_API_KEY and EMAIL_FROM
    (a verified, non-Gmail domain) to be configured."""

    def __init__(self, *, api_key: str, from_email: str, from_name: str = "CoopWise") -> None:
        _validate_from_address(from_email)
        resend.api_key = api_key
        self._from = f"{from_name} <{from_email}>"

    async def send(self, *, to: str, subject: str, html: str) -> None:
        try:
            result = resend.Emails.send(
                {"from": self._from, "to": to, "subject": subject, "html": html}
            )
        except Exception as e:
            logger.error(f"[ResendEmailSender] send failed to {to}: {e}")
            raise EmailSendError(str(e))

        if result is None:
            raise EmailSendError(f"Resend returned no result sending to {to}")


class NullEmailSender:
    """Local/dev/test stand-in: logs instead of sending. No provider
    credentials required to run the app locally — same pattern as
    NullOtpSender in the auth domain."""

    async def send(self, *, to: str, subject: str, html: str) -> None:
        logger.warning(
            f"[NullEmailSender] would send to {to} | subject={subject!r} | "
            f"html={html[:200]}{'...' if len(html) > 200 else ''}"
        )


def get_email_sender(
    *,
    environment: str,
    resend_api_key: Optional[str],
    from_email: Optional[str],
    from_name: str = "CoopWise",
) -> EmailSenderPort:
    """
    Single factory used by DI wiring across domains. environment expects
    your existing config's env value (e.g. config.ENVIRONMENT) — production
    and staging use Resend; anything else (development, test, local) logs
    instead of sending.
    """
    if environment in ("production", "staging"):
        if not resend_api_key or not from_email:
            raise EmailSendError(
                "RESEND_API_KEY and EMAIL_FROM are required in production/staging"
            )
        return ResendEmailSender(
            api_key=resend_api_key, from_email=from_email, from_name=from_name
        )
    return NullEmailSender()