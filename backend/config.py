import json
from typing import Any, Dict
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

from app.utils.logger import logger



BASE_DIR = Path(__file__).resolve().parent.parent 
class GlobalConfig(BaseSettings):
    ENV:str
    PORT:int
    PROJECT_NAME:str
    CLIENT_DOMAIN:str 
    INVITE_CODE_PREFIX:str 
    DOMAIN:str
    DATABASE_URL:str 
    ALGORITHM:str 
    APP_SECRET_KEY:str 
    PAYSTACK_SECRET_KEY:str 
    PAYSTACK_PUBLIC_KEY:str 
    REDIS_URL:str 
    GEMINI_API_KEY:str 
    RATE_LIMIT_RULES_PATH:str 

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")



class DevConfig(GlobalConfig):
    pass

class TestConfig(GlobalConfig):
    pass

class ProdConfig(GlobalConfig):
    pass


def get_config():
    env_state = GlobalConfig().ENV.lower()  # Load from `.env` automatically
    configs = {"development": DevConfig, "production": ProdConfig, "test": TestConfig}
    if env_state not in configs:
        raise ValueError(f"Invalid ENVT_STATE: {env_state}")
    logger.info(f"\nUsing {env_state.capitalize()} config...\n")
    return configs[env_state]()


def load_rate_limit_rules(path: str) -> Dict[str, Any]:
    """
    Loads rate limiting rules from a JSON file.
    Returns default rules if the file is not found or invalid.
    """
    try:
        with open(path, "r") as f:
            rules = json.load(f)
            logger.info(f"\n\nSuccessfully loaded rate limiting rules from \n{path}\n\n")
            return rules
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.warning(f"Could not load rate limit rules from {path}: {e}. Using default rules.")
        # Return a safe default if the file is missing or corrupt
        return {
            "default": {"capacity": 10, "refill_rate": 1}
        }








AppConfig: DevConfig = get_config()
rate_limit_rules = load_rate_limit_rules(AppConfig.RATE_LIMIT_RULES_PATH)