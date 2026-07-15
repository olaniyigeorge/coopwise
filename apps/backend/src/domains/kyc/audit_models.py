from datetime import datetime
import uuid
from sqlalchemy import JSON, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infra.db.database import Base



class KYCAuditLog(Base):
    __tablename__ = "kyc_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    kyc_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("kyc_verifications.id"), index=True)
    admin_id: Mapped[uuid.UUID] = mapped_column(index=True)
    action: Mapped[str] = mapped_column(String(64))          # "approve_step", "reject_step", ...
    step: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reason: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)  # before/after snapshot, score, etc.
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)