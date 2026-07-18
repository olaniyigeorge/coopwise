import base64
import json
from typing import Any, Dict, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

from src.shared.utils.logger import logger


BASE_DIR = Path(__file__).resolve().parent


class GlobalConfig(BaseSettings):
    ENV: str
    PORT: int
    PROJECT_NAME: str
    CLIENT_DOMAIN: str
    INVITE_CODE_PREFIX: str
    DOMAIN: str
    DATABASE_URL: str
    ALGORITHM: str
    APP_SECRET_KEY: str
    PAYSTACK_SECRET_KEY: str
    PAYSTACK_PUBLIC_KEY: str
    REDIS_URL: str
    GEMINI_API_KEY: str
    RATE_LIMIT_RULES_PATH: str
    CROSSMINT_SERVER_API_KEY: str
    CROSSMINT_CHAIN: str
    CROSSMINT_AUDIENCE: str
    FIREBASE_PROJECT_ID: str
    RESEND_API_KEY: str
    EMAIL_FROM_ADDRESS: str
    SMS_PROVIDER_API_KEY: str
    SMS_SENDER_ID: str
    SMS_PROVIDER_BASE_URL: str
    KYC_WEBHOOK_SECRET: str
    CLOUDINARY_URL: str

    # Mail config: required for notification email delivery
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_FROM_NAME: str = "CoopWise"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_TLS: bool = True
    MAIL_SSL: bool = False
    MAIL_USE_CREDENTIALS: bool = True
    SECRET_ENCRYPTION_KEY: str
    JWT_PRIVATE_KEY: str
    JWT_PUBLIC_KEY: str
    JWT_KID: str

    # Sentry: optional, only active in production
    SENTRY_DSN: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("JWT_PRIVATE_KEY", "JWT_PUBLIC_KEY", mode="after")
    @classmethod
    def _decode_pem(cls, v: str) -> str:
        # If it's already a PEM (e.g. someone pastes raw during local dev), pass through.
        if v.strip().startswith("-----BEGIN"):
            return v
        return base64.b64decode(v).decode()


class DevConfig(GlobalConfig):
    pass

class StagingConfig(GlobalConfig):
    pass


class TestConfig(GlobalConfig):
    pass


class ProdConfig(GlobalConfig):
    pass


def get_config() -> GlobalConfig:
    env_state = GlobalConfig().ENV.lower()
    configs = {
        "development": DevConfig,
        "staging": StagingConfig,
        "production": ProdConfig,
        "test": TestConfig,
    }
    if env_state not in configs:
        raise ValueError(f"Invalid ENV: {env_state}. Must be development, production, or test.")
    logger.info(f"\nUsing {env_state.capitalize()} config...\n")
    return configs[env_state]()


def load_rate_limit_rules(path: str) -> Dict[str, Any]:
    default = {"default": {"capacity": 10, "refill_rate": 1}, "rules": []}
    try:
        with open(path, "r") as f:
            rules = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.warning(f"Could not load rate limit rules from {path}: {e}. Using defaults.")
        return default

    try:
        assert "capacity" in rules.get("default", {}) and "refill_rate" in rules.get("default", {})
        for rule in rules.get("rules", []):
            assert "path_prefix" in rule and "capacity" in rule and "refill_rate" in rule
            float(rule["capacity"]); float(rule["refill_rate"])
    except (AssertionError, TypeError, ValueError) as e:
        logger.error(f"Invalid rate_limit_rules.json shape: {e}. Falling back to safe default.")
        return default

    logger.info(f"Loaded rate limiting rules from {path}")
    return rules

AppConfig: GlobalConfig = get_config()


rate_limit_rules = load_rate_limit_rules(AppConfig.RATE_LIMIT_RULES_PATH)