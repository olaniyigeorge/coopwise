import hashlib
import json

from redis.asyncio import Redis
import redis as sync_redis
from fastapi import HTTPException, Header, Depends, status

from config import AppConfig as config
from src.infra.cache.redis_client import get_redis

IDEMPOTENCY_TTL_SECONDS = 24 * 3600


_sync_redis_client: sync_redis.Redis | None = None

def _get_sync_redis() -> sync_redis.Redis:
    global _sync_redis_client
    if _sync_redis_client is None:
        _sync_redis_client = sync_redis.from_url(config.REDIS_URL)
    return _sync_redis_client

def acquire_idempotency_lock(key: str, ttl_seconds: int = 24 * 3600) -> bool:
    return _get_sync_redis().set(key, "in_progress", nx=True, ex=ttl_seconds) is True

    
async def require_idempotency_key(
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    redis: Redis = Depends(get_redis),
) -> str:
    if not (8 <= len(idempotency_key) <= 128):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid Idempotency-Key")
    return idempotency_key


class IdempotencyGuard:
    def __init__(self, redis: Redis, scope: str):
        self._redis = redis
        self._scope = scope

    def _key(self, user_id, idempotency_key: str) -> str:
        return f"idem:{self._scope}:{user_id}:{idempotency_key}"

    async def start(
        self,
        user_id,
        idempotency_key: str,
    ) -> bool:
        """
        Returns True if this request owns execution.
        Returns False if another request already started.
        """
        key = self._key(user_id, idempotency_key)

        return await self._redis.set(
            key,
            json.dumps({
                "status": "processing"
            }),
            nx=True,
            ex=IDEMPOTENCY_TTL_SECONDS,
        )


    async def get_result(
        self,
        user_id,
        idempotency_key: str,
    ):
        key = self._key(user_id, idempotency_key)

        value = await self._redis.get(key)

        if not value:
            return None

        return json.loads(value)


    async def complete(
        self,
        user_id,
        idempotency_key: str,
        response: dict,
    ):
        key = self._key(user_id, idempotency_key)

        await self._redis.set(
            key,
            json.dumps({
                "status": "completed",
                "response": response,
            }),
            ex=IDEMPOTENCY_TTL_SECONDS,
        )