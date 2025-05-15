from fastapi import Depends
from app.api.v1.routes.auth import get_current_user
from app.api.v1.routes.auth import require_admin_or_owner




user_dependency = Depends(get_current_user)
user_dependency = Depends(require_admin_or_owner)

 