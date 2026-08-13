import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from src.domains.cooperatives.models.cooperative import CoopCooperative
from src.infra.db.database import Base
from src.domains.cooperatives.models.mixins import (
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class CoopActivity(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "coop_activities"

    cooperative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("coop_cooperatives.id"),
        nullable=False,
        index=True,
    )

    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    activity_type: Mapped[str] = mapped_column(String(64), nullable=False)

    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)

    entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )

    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)

    cooperative: Mapped["CoopCooperative"] = relationship(back_populates="activities")
