import redis.asyncio as redis
from typing import Optional
import logging

from config import AppConfig


# A simple Redis client wrapper for async operations
class RedisClient:
    _instance: Optional[redis.Redis] = None

    @classmethod
    async def get_instance(cls):
        if cls._instance is None:
            if not AppConfig.REDIS_URL:
                raise RuntimeError("Redis URL is not configured.")
            cls._instance = redis.from_url(AppConfig.REDIS_URL, decode_responses=True)
        return cls._instance

    @classmethod
    async def close_instance(cls):
        if cls._instance:
            await cls._instance.close()
            cls._instance = None





logger = logging.getLogger("app")

class RedisManager:
    def __init__(self) -> None:
        self.client: redis.Redis | None = None

    async def initialize(
        self,
        url: str = AppConfig.REDIS_URL,
        decode_responses: bool = True,
    ) -> redis.Redis:
        self.client = redis.from_url(url, decode_responses=decode_responses)
        # health check
        await self.client.ping()
        logger.info("Redis connected (%s)", url)
        return self.client

    async def close(self) -> None:
        if self.client is None:
            return
        await self.client.aclose()  # preferred for redis-py asyncio
        self.client = None
        logger.info("Redis connection closed")

redis_manager = RedisManager()
