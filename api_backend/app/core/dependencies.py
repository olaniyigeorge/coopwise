

from fastapi import Depends
from app.api.v1.routes.auth import get_current_user




user_dependency = Depends(get_current_user)

 