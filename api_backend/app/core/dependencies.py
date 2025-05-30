from fastapi import Depends
import redis
from app.api.v1.routes.auth import get_current_user
from app.api.v1.routes.auth import is_admin_or_owner


async def get_redis() -> redis.Redis:
    return redis


user_dependency = Depends(get_current_user)
admin_or_owner_dependency = Depends(is_admin_or_owner)


# Cache dependency
redis_dependency = Depends(get_redis)
 