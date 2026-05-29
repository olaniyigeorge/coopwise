import json
import httpx
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from src.shared.utils.logger import logger

AI_CHAT_SYSTEM = "You are a helpful financial assistant for a cooperative savings platform called Coopwise."
MAX_HISTORY_MESSAGES = 20
REDIS_KEY_PREFIX = "ai_chat:"

def load_messages(redis_client: Redis, uid: str) -> list:
    try:
        data = redis_client.get(f"{REDIS_KEY_PREFIX}{uid}")
        return json.loads(data) if data else []
    except Exception:
        return []

def save_messages(redis_client: Redis, uid: str, messages: list):
    try:
        redis_client.set(f"{REDIS_KEY_PREFIX}{uid}", json.dumps(messages), ex=86400)
    except Exception as e:
        logger.error(f"Failed to save messages: {e}")

def clear_messages(redis_client: Redis, uid: str):
    try:
        redis_client.delete(f"{REDIS_KEY_PREFIX}{uid}")
    except Exception as e:
        logger.error(f"Failed to clear messages: {e}")

async def openai_chat_with_messages(messages: list, max_tokens: int = 800, temperature: float = 0.6) -> str:
    from config import AppConfig as config
    api_key = getattr(config, "OPENAI_API_KEY", None)
    if not api_key:
        return "AI assistant is not configured."
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"model": "gpt-4o-mini", "messages": messages, "max_tokens": max_tokens, "temperature": temperature},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

class EventService:
    def __init__(self, db: AsyncSession):
        self.db = db
