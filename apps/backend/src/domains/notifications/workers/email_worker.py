"""Email worker skeleton for notifications."""

from src.domains.notifications.providers.email import EmailProvider


class EmailWorker:
    """Worker responsible for dispatching email notifications asynchronously."""

    async def process(self, payload: dict) -> bool:
        provider = EmailProvider()
        return await provider.send(payload["recipient"], payload["message"], payload)
