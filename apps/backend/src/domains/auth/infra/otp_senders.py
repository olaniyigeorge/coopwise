"""
OtpSenderPort implementations.

Both classes match OtpSenderPort's shape exactly (channel + send_otp) so
AuthService never knows or cares which one it's holding — it just indexes
into otp_senders[channel].

STATUS: provider not yet chosen (SMS: Termii vs Africa's Talking vs
Twilio — TBD; email: Resend, planned but not yet wired). Both classes
below are real, working interfaces with the actual provider call left as
a clearly-marked TODO so this can ship and be tested end-to-end (with
NullOtpSender swapped in for local/dev) before the provider decision is
final. Swapping in a real provider later means filling in the marked
method body only — nothing else in the auth domain changes.
"""
from __future__ import annotations

import httpx

from src.domains.auth.exceptions import OtpDeliveryError
from src.domains.auth.ports import OtpChannel
from src.shared.utils.logger import logger


class SmsOtpSender:
    """Phone channel. Provider TBD (Termii / Africa's Talking / Twilio)."""

    channel = OtpChannel.phone

    def __init__(self, api_key: str, sender_id: str, api_base_url: str) -> None:
        self._api_key = api_key
        self._sender_id = sender_id
        self._api_base_url = api_base_url.rstrip("/")
        self._http = httpx.AsyncClient(timeout=10.0)

    async def send_otp(self, identifier: str, code: str) -> None:
        # TODO: replace with the chosen provider's actual send-SMS call.
        # Keep the message copy short/clear — many target users are on
        # low-end devices with small SMS previews.
        message = f"Your CoopWise verification code is {code}. It expires in 10 minutes."
        try:
            resp = await self._http.post(
                f"{self._api_base_url}/sms/send",
                headers={"Authorization": f"Bearer {self._api_key}"},
                json={"to": identifier, "from": self._sender_id, "message": message},
            )
            resp.raise_for_status()
        except httpx.HTTPError as e:
            logger.error(f"[SmsOtpSender] delivery failed for {identifier}: {e}")
            raise OtpDeliveryError(f"Could not send SMS to {identifier}")


class EmailOtpSender:
    """Email channel — delegates to the shared src/infra/resend sender
    (Resend in staging/prod, logged-only in dev). No direct httpx/Resend
    coupling in the auth domain itself."""

    channel = OtpChannel.email

    def __init__(self, email_sender) -> None:
        self._email_sender = email_sender

    async def send_otp(self, identifier: str, code: str) -> None:
        subject = "Your CoopWise verification code"
        html = (
            f"<p>Your verification code is <strong>{code}</strong>. "
            "It expires in 10 minutes.</p>"
        )
        try:
            print(html)
            await self._email_sender.send(to=identifier, subject=subject, html=html)
        except Exception as e:
            logger.error(f"[EmailOtpSender] delivery failed for {identifier}: {e}")
            raise OtpDeliveryError(f"Could not send email to {identifier}")


class NullOtpSender:
    """Local/dev/test stand-in for either channel: logs the code instead of
    sending it. Swap this in via dependencies.py when SMS/email provider
    keys aren't configured (e.g. local dev), so the OTP flow is fully
    exercisable without paying for real SMS/email sends."""

    def __init__(self, channel: OtpChannel) -> None:
        self.channel = channel

    async def send_otp(self, identifier: str, code: str) -> None:
        logger.warning(
            f"[NullOtpSender] {self.channel.value} OTP for {identifier}: {code} "
            "(not actually sent — no provider configured)"
        )