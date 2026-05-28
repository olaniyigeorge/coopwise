# mailer.py
from fastapi import UploadFile
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from dotenv import load_dotenv
from typing import Dict, List
from jinja2 import Environment, FileSystemLoader, select_autoescape
import pathlib


from config import AppConfig

load_dotenv()


# Path to templates directory
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent  # goes up from /utils to /src
TEMPLATES_DIR = BASE_DIR / "templates"

env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(['html', 'xml'])
)

def render_template(template_name: str, **kwargs) -> str:
    template = env.get_template(template_name)
    return template.render(**kwargs)


conf = ConnectionConfig(
    MAIL_USERNAME=AppConfig.MAIL_USERNAME,
    MAIL_PASSWORD=AppConfig.MAIL_PASSWORD,
    MAIL_FROM=AppConfig.MAIL_FROM,
    MAIL_FROM_NAME=getattr(AppConfig, "MAIL_FROM_NAME", "Revela App"),
    MAIL_PORT=int(getattr(AppConfig, "MAIL_PORT", 587)),
    MAIL_SERVER=getattr(AppConfig, "MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=str(getattr(AppConfig, "MAIL_TLS", "True")).lower() == "true",
    MAIL_SSL_TLS=str(getattr(AppConfig, "MAIL_SSL", "False")).lower() == "true",
    USE_CREDENTIALS=str(getattr(AppConfig, "MAIL_USE_CREDENTIALS", "True")).lower() == "true",
    VALIDATE_CERTS = True
)

fm = FastMail(conf)


async def send_email(
    subject: str,
    recipients: List[EmailStr],
    body: str,
    subtype: str = "html",
    attachments: List[UploadFile | Dict | str] = []
):
    """
    Send an email using FastAPI-Mail.
    """
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype=subtype,
        attachments=attachments
    )
    await fm.send_message(message)



# Test
async def send_welcome_email(to: EmailStr, username: str):
    """
    Example: Send a predefined welcome email.
    """
    body = f"""
    <h1>Welcome, {username}!</h1>
    <p>Thanks for signing up for on Revela.</p>
    """
    await send_email(
        subject="Welcome to Revela!",
        recipients=[to],
        body=body
    )



async def email_notify_admin(message: str):
    """
    Example: Send a notification email to the admin.
    """
    print(f"\n📬 Sending admin notification: {message}")
    await send_email(
        subject="Admin Notification",
        recipients=['olaniyigeorge77@gmail.com'], # AppConfig.MAIL_FROM
        body=message
    )
