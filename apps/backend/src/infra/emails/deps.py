from config import AppConfig as config
from src.infra.emails.resend import get_email_sender
from src.infra.emails.ports import EmailSenderPort


def build_email_sender() -> EmailSenderPort:
    return get_email_sender(
        environment=config.ENV,
        resend_api_key=getattr(config, "RESEND_API_KEY", None),
        from_email=getattr(config, "EMAIL_FROM_ADDRESS", None),
    )
