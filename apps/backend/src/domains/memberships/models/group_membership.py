import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from src.domains.cooperatives.models.cooperative import CoopCooperative
    from src.domains.users.models import User

from src.domains.memberships.models.enums import MembershipRole, MembershipStatus
from src.domains.memberships.models.mixins import UUIDPrimaryKeyMixin, TimestampMixin
from src.infra.db.database import Base


class GroupMembership(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "group_memberships"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coop_cooperatives.id"), nullable=False
    )
    role: Mapped[MembershipRole] = mapped_column(
        String(32), default=MembershipRole.member, nullable=False
    )
    status: Mapped[MembershipStatus] = mapped_column(
        String(32), default=MembershipStatus.ACTIVE, nullable=False
    )
    joined_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    left_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship(
        back_populates="memberships",
        foreign_keys=[user_id],
        overlaps="cooperatives,group",
    )
    group: Mapped["CoopCooperative"] = relationship(
        back_populates="memberships", overlaps="users,cooperatives"
    )

    def __repr__(self) -> str:
        return f"<GroupMembership user={self.user_id} group={self.group_id} role={self.role}>"
