from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

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
    PAYSTACK_PUBLIC_KEY:str
    REDIS_URL: str
    CASHRAMP_PUBKEY: str
    CASHRAMP_SECKEY: str
    GEMINI_API_KEY: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    
    )

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
    print(f"\nUsing {env_state.capitalize()} config...\n")
    return configs[env_state]()


config: DevConfig = get_config()