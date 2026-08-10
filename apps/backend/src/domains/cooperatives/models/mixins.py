import uuid
from datetime import datetime, date, timezone
from sqlalchemy import DateTime, Date, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infra.db.database import Base

__all__ = ["Base", "UUIDPrimaryKeyMixin", "TimestampMixin", "VersionedMixin"]


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )



class VersionedMixin:
    """
    Applied to the four rule-module tables (governance / membership /
    financial / decision). A cooperative's rules change over time, and
    disputes / AI governance reasoning / audit history must resolve
    against the rules as they stood *at the time*, not today's — so every
    edit is a new row, never an UPDATE of an existing one.

    `effective_to IS NULL` means "currently in effect".
    "at most one currently-effective row per (cooperative_id[, decision_type])"
    enforced at the application/service layer (e.g. in the same transaction that
    inserts a new version, the previous row's `effective_to` is closed out)
    rather than as a DB constraint, since Postgres partial unique indexes
    on NULL don't compose cleanly with the extra `decision_type` grouping
    key on `decision_rules`.
    """

    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    effective_from: Mapped[date] = mapped_column(
        Date, nullable=False, server_default=func.current_date()
    )
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
