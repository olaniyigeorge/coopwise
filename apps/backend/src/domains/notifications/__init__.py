"""Notifications domain package.

Contains the domain-specific service, router, event, task, and provider abstractions
for notification delivery and orchestration.
"""

from .service import NotificationService
from .router import router

__all__ = ["NotificationService", "router"]
