import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from src.domains.cooperatives.models.cooperative import CoopCooperative
    from src.domains.users.models import User

from src.domains.memberships.models.enums import InvitationStatus
from src.domains.memberships.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin
from src.infra.db.database import Base


class CoopInvitation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Owns the pre-membership invite lifecycle only. Accepting an invitation is a
    service-layer operation that creates the corresponding GroupMembership row
    and transitions status -> accepted — not handled here.
    # TODO: service-layer acceptance flow
    """

    __tablename__ = "coop_invitations"

    cooperative_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("coop_cooperatives.id"),
        nullable=False,
        index=True,
    )
    invited_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    invitee_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    invite_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[InvitationStatus] = mapped_column(
        String(32), default=InvitationStatus.PENDING, nullable=False
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    responded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    cooperative: Mapped["CoopCooperative"] = relationship(
        back_populates="invitations", overlaps="memberships,users"
    )
    inviter: Mapped["User"] = relationship(foreign_keys=[invited_by])
    invitee: Mapped["User | None"] = relationship(foreign_keys=[invitee_user_id])

    def __repr__(self) -> str:
        return f"<CoopInvitation id={self.id} cooperative={self.cooperative_id} status={self.status}>"
