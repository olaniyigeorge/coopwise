import uuid

from sqlalchemy import Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.domains.memberships.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin
from src.infra.db.database import Base


class MembershipVote(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    One member's vote on a pending application (group_memberships row in
    `pending` status), used when a cooperative admits members by vote. A voter
    can change their vote until the application is decided, hence the unique
    (membership, voter) pair that is upserted.
    """

    __tablename__ = "membership_votes"
    __table_args__ = (
        UniqueConstraint("membership_id", "voter_id", name="uq_membership_votes_pair"),
    )

    membership_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("group_memberships.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    voter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    approve: Mapped[bool] = mapped_column(Boolean, nullable=False)
