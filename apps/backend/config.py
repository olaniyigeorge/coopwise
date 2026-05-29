import json
from typing import Any, Dict, Optional
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
    CELERY_BROKER_URL:str

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

    # Sentry: optional, only active in production
    SENTRY_DSN: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


class DevConfig(GlobalConfig):
    pass


class TestConfig(GlobalConfig):
    pass


class ProdConfig(GlobalConfig):
    pass


def get_config() -> GlobalConfig:
    env_state = GlobalConfig().ENV.lower()
    configs = {
        "development": DevConfig,
        "production": ProdConfig,
        "test": TestConfig,
    }
    if env_state not in configs:
        raise ValueError(f"Invalid ENV: {env_state}. Must be development, production, or test.")
    logger.info(f"\nUsing {env_state.capitalize()} config...\n")
    return configs[env_state]()


def load_rate_limit_rules(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r") as f:
            rules = json.load(f)
            logger.info(f"Loaded rate limiting rules from {path}")
            return rules
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.warning(f"Could not load rate limit rules from {path}: {e}. Using defaults.")
        return {"default": {"capacity": 10, "refill_rate": 1}}


AppConfig: GlobalConfig = get_config()


rate_limit_rules = load_rate_limit_rules(AppConfig.RATE_LIMIT_RULES_PATH)