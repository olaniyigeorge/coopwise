from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.utils.logger import logger


class GlobalConfig(BaseSettings):
    ENV: str
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
    CASHRAMP_PUBKEY: str
    CASHRAMP_SECKEY: str
    GEMINI_API_KEY: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


class DevConfig(GlobalConfig):
    # ENV: str
    # PROJECT_NAME: str
    # CLIENT_DOMAIN: str
    # INVITE_CODE_PREFIX: str
    # DOMAIN: str
    # DATABASE_URL: str
    # ALGORITHM: str
    # APP_SECRET_KEY: str
    # PAYSTACK_SECRET_KEY: str
    # PAYSTACK_PUBLIC_KEY:str
    # REDIS_URL: str
    # CASHRAMP_PUBKEY: str
    # CASHRAMP_SECKEY: str
    # GEMINI_API_KEY: str

    # model_config = SettingsConfigDict(
    #     env_prefix=str = "DEV_"

    # )
    pass


class TestConfig(GlobalConfig):
    # ENV: str
    # PROJECT_NAME: str
    # CLIENT_DOMAIN: str
    # INVITE_CODE_PREFIX: str
    # DOMAIN: str
    # DATABASE_URL: str
    # ALGORITHM: str
    # APP_SECRET_KEY: str
    # PAYSTACK_SECRET_KEY: str
    # PAYSTACK_PUBLIC_KEY:str
    # REDIS_URL: str
    # CASHRAMP_PUBKEY: str
    # CASHRAMP_SECKEY: str
    # GEMINI_API_KEY: str

    # # model_config = SettingsConfigDict(
    # #     env_prefix=str = "TEST_"

    # # )
    pass


class ProdConfig(GlobalConfig):
    # ENV: str
    # PROJECT_NAME: str
    # CLIENT_DOMAIN: str
    # INVITE_CODE_PREFIX: str
    # DOMAIN: str
    # DATABASE_URL: str
    # ALGORITHM: str
    # APP_SECRET_KEY: str
    # PAYSTACK_SECRET_KEY: str
    # PAYSTACK_PUBLIC_KEY:str
    # REDIS_URL: str
    # CASHRAMP_PUBKEY: str
    # CASHRAMP_SECKEY: str
    # GEMINI_API_KEY:str

    # model_config = SettingsConfigDict(
    #     env_prefix=str = "PROD_"

    # )
    pass


def get_config():
    env_state = GlobalConfig().ENV.lower()  # Load from `.env` automatically
    configs = {"dev": DevConfig, "prod": ProdConfig, "test": TestConfig}
    if env_state not in configs:
        raise ValueError(f"Invalid ENVT_STATE: {env_state}")
    logger.info(f"\nUsing {env_state.capitalize()} config...\n")
    return configs[env_state]()


# Lazy config loading to avoid import-time errors
def get_lazy_config():
    try:
        return get_config()
    except Exception:
        # Return a default config for testing
        class DefaultConfig:
            ENV = "test"
            PROJECT_NAME = "Coopwise"
            CLIENT_DOMAIN = "http://localhost:3000"
            INVITE_CODE_PREFIX = "XYZ"
            DOMAIN = "http://localhost:8000"
            DATABASE_URL = "sqlite+aiosqlite:///:memory:"
            ALGORITHM = "HS256"
            APP_SECRET_KEY = "test_secret"
            PAYSTACK_SECRET_KEY = "test"
            PAYSTACK_PUBLIC_KEY = "test"
            REDIS_URL = "redis://localhost:6379"
            CASHRAMP_PUBKEY = "test"
            CASHRAMP_SECKEY = "test"
            GEMINI_API_KEY = "test"
        return DefaultConfig()

config: DevConfig = get_lazy_config()
