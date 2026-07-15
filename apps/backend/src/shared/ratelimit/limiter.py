from __future__ import annotations

import time
from dataclasses import dataclass

from redis.asyncio import Redis
from fastapi import HTTPException, Request, Depends, status

from src.api.middlewares.dependencies import get_redis, get_optional_current_user

_INCR_EXPIRE_LUA = """
local current = redis.call("INCR", KEYS[1])
if current == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return current
"""


@dataclass
class RateLimitResult:
    allowed: bool
    current: int
    limit: int
    retry_after_seconds: int


class RateLimiter:
    def __init__(self, redis: Redis):
        self._redis = redis
        self._script = redis.register_script(_INCR_EXPIRE_LUA)

    async def check(self, key: str, limit: int, window_seconds: int) -> RateLimitResult:
        current = await self._script(keys=[key], args=[window_seconds])
        current = int(current)
        ttl = await self._redis.ttl(key)
        return RateLimitResult(
            allowed=current <= limit,
            current=current,
            limit=limit,
            retry_after_seconds=max(ttl, 1),
        )


def rate_limit(limit: int, window_seconds: int, scope: str, key_func=None):
    """FastAPI dependency factory — use in a route's `dependencies=[...]` list.

        dependencies=[Depends(rate_limit(limit=5, window_seconds=3600, scope="kyc:identity"))]
    """
    async def dependency(
        request: Request,
        redis: Redis = Depends(get_redis),
        user=Depends(get_optional_current_user),
    ):
        if key_func:
            identity = key_func(request, user)
        else:
            identity = str(user.id) if user else request.client.host
        window_bucket = int(time.time()) // window_seconds
        redis_key = f"ratelimit:{scope}:{identity}:{window_bucket}"

        limiter = RateLimiter(redis)
        result = await limiter.check(redis_key, limit, window_seconds)
        if not result.allowed:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for {scope}. Try again in {result.retry_after_seconds}s.",
                headers={"Retry-After": str(result.retry_after_seconds)},
            )
    return dependency