from dotenv import load_dotenv
from functools import lru_cache
from pydantic_settings import BaseSettings

class GlobalConfig(BaseSettings):
    ENV: str
    PROJECT_NAME: str
    CLIENT_DOMAIN: str
    DOMAIN: str
    DATABASE_URL: str
    ALGORITHM: str
    APP_SECRET_KEY: str
    class Config:
        env_file = ".env"
        extra = "ignore"  

class DevConfig(GlobalConfig):
    ENV: str
    PROJECT_NAME: str
    CLIENT_DOMAIN: str
    DOMAIN: str
    DATABASE_URL: str
    ALGORITHM: str
    APP_SECRET_KEY: str
    # class Config:
    #     env_prefix: str = "DEV_"

class TestConfig(GlobalConfig):
    ENV: str
    PROJECT_NAME: str
    CLIENT_DOMAIN: str
    DOMAIN: str
    DATABASE_URL: str
    ALGORITHM: str
    APP_SECRET_KEY: str
    # class Config:
    #     env_prefix: str = "TEST_"

class ProdConfig(GlobalConfig):
    ENV: str
    PROJECT_NAME: str
    CLIENT_DOMAIN: str
    DOMAIN: str
    DATABASE_URL: str
    ALGORITHM: str
    APP_SECRET_KEY: str
    # class Config:
    #     env_prefix: str = "PROD_"


@lru_cache()
def get_config():
    env_state = GlobalConfig().ENV.lower()  # Load from `.env` automatically
    configs = {"dev": DevConfig, "prod": ProdConfig, "test": TestConfig}
    if env_state not in configs:
        raise ValueError(f"Invalid ENVT_STATE: {env_state}")
    print(f"\nUsing {env_state.capitalize()} config...\n")
    return configs[env_state]()


config: DevConfig = get_config()