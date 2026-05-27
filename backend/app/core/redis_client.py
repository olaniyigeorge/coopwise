import logging
import redis.asyncio as redis
from typing import Optional

from config import AppConfig

logger = logging.getLogger("app")


class RedisManager:
    """
    Single Redis client manager for the entire application.
    Initialized once at startup via lifespan, shared via app.state.redis.
    """

    def __init__(self) -> None:
        self.client: Optional[redis.Redis] = None

    async def initialize(
        self,
        url: str = AppConfig.REDIS_URL,
        decode_responses: bool = True,
    ) -> redis.Redis:
        self.client = redis.from_url(url, decode_responses=decode_responses)
        await self.client.ping()
        logger.info("Redis connected (%s)", url)
        return self.client

    async def close(self) -> None:
        if self.client is None:
            return
        await self.client.aclose()
        self.client = None
        logger.info("Redis connection closed")

    def get(self) -> redis.Redis:
        """
        Return the active client. Raises if called before initialize().
        Use this for synchronous access after startup.
        """
        if self.client is None:
            raise RuntimeError("RedisManager not initialized. Call initialize() first.")
        return self.client


redis_manager = RedisManager()