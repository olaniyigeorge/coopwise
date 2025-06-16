
import json
from typing import Callable, Any
import redis.asyncio as redis
from fastapi import Depends
from app.core.config import config


if config.ENV == "dev":
    redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
    CACHE_TTL = 300
else: 
    REDIS_URL = config.REDIS_URL
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)




# async def get_or_set(
#     redis: Redis,
#     key: str,
#     fetch_fn: Callable[[], Any],
#     ttl: int = 300
# ) -> Any:
#     cached = await redis.get(key)
#     if cached:
#         return json.loads(cached)

#     result = await fetch_fn()
#     await redis.set(key, json.dumps(result, default=str), ex=ttl)
#     return result



async def get_cache(key: str):
    """Retrieve data from cache."""
    data = await redis_client.get(key)
    return json.loads(data) if data else None

async def update_cache(key: str, value: dict, ttl: int = 300):
    """
    Update cache with a new value and set a time-to-live (TTL).
    """
    await redis_client.setex(key, ttl, json.dumps(value))