"""SMS worker skeleton for notifications."""

from src.domains.notifications.providers.sms import SMSProvider


class SMSWorker:
    """Worker responsible for dispatching SMS notifications asynchronously."""

    async def process(self, payload: dict) -> bool:
        provider = SMSProvider()
        return await provider.send(payload["recipient"], payload["message"], payload)
