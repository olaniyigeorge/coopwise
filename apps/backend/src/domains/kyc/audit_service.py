from src.domains.kyc.ports import KYCAuditRepositoryPort


class KYCAuditService:
    def __init__(self, repo: KYCAuditRepositoryPort, logger):
        self._repo = repo
        self._logger = logger

    async def log(
        self, *, kyc_id, admin_id, action: str, step: str | None = None,
        reason: str | None = None, metadata: dict | None = None,
        ip_address: str | None = None, user_agent: str | None = None,
    ):
        entry = await self._repo.create(
            kyc_id=kyc_id, admin_id=admin_id, action=action, step=step,
            reason=reason, metadata=metadata or {}, ip_address=ip_address, user_agent=user_agent,
        )
        # structured stream log — separate logger name so you can route it
        # differently (e.g. its own BetterStack source) from app logs
        self._logger.info(
            "kyc_admin_action",
            extra={
                "event": "kyc_admin_action", "kyc_id": str(kyc_id), "admin_id": str(admin_id),
                "action": action, "step": step, "reason": reason,
            },
        )
        return entry