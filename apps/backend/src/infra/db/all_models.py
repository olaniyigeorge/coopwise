"""
Single place that imports every domain's SQLAlchemy model module, so that
Base.registry is fully populated regardless of entrypoint (FastAPI request
path vs. Celery worker vs. Alembic autogenerate). Import this — not the
individual model modules — anywhere mappers need to be guaranteed
complete before the first query.

Add a line here every time a new domain adds models.
"""
from src.domains.circles import models as _circles_models        # noqa: F401
from src.domains.memberships import models as _memberships_models  # noqa: F401
from src.domains.contributions import models as _contributions_models  # noqa: F401
from src.domains.kyc import models as _kyc_models                # noqa: F401
from src.domains.notifications import models as _notifications_models  # noqa: F401
from src.domains.payments import models as _payments_models      # noqa: F401
from src.domains.wallets import models as _wallets_models        # noqa: F401
from src.domains.users import models as _users_models            # noqa: F401
from src.domains.insights import models as _insights_models      # noqa: F401
from src.domains.analytics import models as _analytics_models    # noqa: F401
from src.domains.support import models as _support_models        # noqa: F401
from src.domains.ai_chat import models as _ai_chat_models         # noqa: F401