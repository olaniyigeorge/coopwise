import hashlib

from redis.asyncio import Redis
import redis as sync_redis
from fastapi import HTTPException, Header, Depends, status

from config import AppConfig as config
from src.api.middlewares.dependencies import get_redis

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
        # scope by user so one user can't collide/spoof another's key
        return f"idem:{self._scope}:{user_id}:{idempotency_key}"

    async def acquire(self, user_id, idempotency_key: str) -> bool:
        """Returns True if this is a new request (proceed), False if a
        duplicate (already processed or currently in-flight — caller decides)."""
        key = self._key(user_id, idempotency_key)
        acquired = await self._redis.set(key, "in_progress", nx=True, ex=IDEMPOTENCY_TTL_SECONDS)
        return acquired is True

    async def mark_complete(self, user_id, idempotency_key: str, result_marker: str = "done"):
        key = self._key(user_id, idempotency_key)
        await self._redis.set(key, result_marker, ex=IDEMPOTENCY_TTL_SECONDS)

    async def release_on_failure(self, user_id, idempotency_key: str):
        # if the request fails validation before any side effect happened,
        # free the key so the client's retry isn't permanently blocked
        key = self._key(user_id, idempotency_key)
        await self._redis.delete(key)