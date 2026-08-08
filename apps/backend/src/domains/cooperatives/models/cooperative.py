import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from src.domains.cooperatives.models.activity_log import CoopActivity
    from src.domains.cooperatives.models.rules import (
        CoopGovernanceRule,
        CoopMembershipRule,
        CoopFinancialRule,
        CoopDecisionRule,
    )
    from src.domains.cooperatives.models.goals import CoopGoal
    from src.domains.memberships.models.invitation import CoopInvitation
    from src.domains.memberships.models.group_membership import GroupMembership
    from src.domains.users.models import User

from src.domains.cooperatives.models.enums import CooperativeStatus, CooperativeModel
from src.domains.cooperatives.models.mixins import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class CoopCooperative(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A Cooperative is a container that composes the four versioned rule 
    modules and owns zero or more Goals — it does NOT itself hold 
    financial/governance logic inline (that's the point of the engine 
    split).
    """

    __tablename__ = "coop_cooperatives"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_image: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    status: Mapped[CooperativeStatus] = mapped_column(
        String(32), default=CooperativeStatus.PENDING, nullable=False
    )

    coop_model: Mapped[CooperativeModel] = mapped_column(
        String(32), default=CooperativeModel.COOP, nullable=False
    )

    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # --- relationships ---
    governance_rules: Mapped[list["CoopGovernanceRule"]] = relationship(
        back_populates="cooperative", cascade="all, delete-orphan"
    )
    membership_rules: Mapped[list["CoopMembershipRule"]] = relationship(
        back_populates="cooperative", cascade="all, delete-orphan"
    )
    financial_rules: Mapped[list["CoopFinancialRule"]] = relationship(
        back_populates="cooperative", cascade="all, delete-orphan"
    )
    decision_rules: Mapped[list["CoopDecisionRule"]] = relationship(
        back_populates="cooperative", cascade="all, delete-orphan"
    )
    goals: Mapped[list["CoopGoal"]] = relationship(
        back_populates="cooperative", cascade="all, delete-orphan"
    )
    memberships: Mapped[list["GroupMembership"]] = relationship(
        back_populates="group",
        cascade="all, delete-orphan",
        overlaps="users,memberships",
    )
    users: Mapped[list["User"]] = relationship(
        secondary="group_memberships",
        back_populates="cooperatives",
        viewonly=False,
        overlaps="group,memberships,user",
    )
    invitations: Mapped[list["CoopInvitation"]] = relationship(
        back_populates="cooperative",
        cascade="all, delete-orphan",
        overlaps="memberships,users",
    )

    activities: Mapped[list["CoopActivity"]] = relationship(
        back_populates="cooperative",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<CoopCooperative id={self.id} name={self.name!r} status={self.status}>"