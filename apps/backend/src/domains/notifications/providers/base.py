"""Notification provider base classes and interfaces."""

from abc import ABC, abstractmethod
from typing import Any, Dict


class NotificationProvider(ABC):
    """Shared provider contract for all notification delivery channels."""

    @abstractmethod
    async def send(self, recipient: str, message: str, metadata: Dict[str, Any]) -> bool:
        raise NotImplementedError()
