"""
Single place that imports every domain's SQLAlchemy model module, so that
Base.registry is fully populated regardless of entrypoint (FastAPI request
path vs. Celery worker vs. Alembic autogenerate). Import this — not the
individual model modules — anywhere mappers need to be guaranteed
complete before the first query.

"""

from src.domains.cooperatives.models import rules as _rules_models  # noqa: F401
from src.domains.cooperatives.models import goals as _goals_models  # noqa: F401
from src.domains.cooperatives.models import mixins as _mixins_models  # noqa: F401
from src.domains.cooperatives.models import enums as _enums_models  # noqa: F401
from src.domains.cooperatives.models import (
    activity_log as _activity_log_models,   # noqa: F401
)  
from src.domains.cooperatives.models import (
    cooperative as _cooperative_models,    # noqa: F401
) 

from src.domains.memberships.models import (
    enums as _membership_enums_models,   # noqa: F401
) 
from src.domains.memberships.models import (
    invitation as _membership_invitation_models,    # noqa: F401
) 
from src.domains.memberships.models import (
    group_membership as _group_membership_models, # noqa: F401
)  
from src.domains.memberships.models import mixins as _membership_mixins  # noqa: F401

from src.domains.contributions import models as _contributions_models  # noqa: F401
from src.domains.kyc import models as _kyc_models  # noqa: F401
from src.domains.notifications import models as _notifications_models  # noqa: F401
from src.domains.payments import models as _payments_models  # noqa: F401
from src.domains.wallets import models as _wallets_models  # noqa: F401
from src.domains.users import models as _users_models  # noqa: F401
from src.domains.insights import models as _insights_models  # noqa: F401
from src.domains.analytics import models as _analytics_models  # noqa: F401
from src.domains.support import models as _support_models  # noqa: F401
from src.domains.ai_chat import models as _ai_chat_models  # noqa: F401
