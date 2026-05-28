"""Register API routers for all supported domains.

This module centralizes app route inclusion so the backend startup file remains clean
and domain-level route ownership is easier to reason about.
"""

from src.domains.auth.router import router as auth_router
from src.domains.users.router import router as users_router
from src.domains.circles.router import router as circles_router
from src.domains.memberships.router import router as memberships_router
from src.domains.contributions.router import router as contributions_router
from src.domains.dashboard.router import router as dashboard_router
from src.domains.notifications.router import router as notifications_router
from src.domains.support.router import router as support_router
from src.domains.payments.router import router as payments_router
from src.domains.wallets.router import router as wallets_router
from src.domains.insights.router import router as insights_router
from src.domains.analytics.router import router as analytics_router
from src.domains.ai_chat.router import router as ai_chat_router

router_list = [
    auth_router,
    users_router,
    circles_router,
    memberships_router,
    contributions_router,
    dashboard_router,
    notifications_router,
    support_router,
    payments_router,
    wallets_router,
    insights_router,
    analytics_router,
    ai_chat_router,
]