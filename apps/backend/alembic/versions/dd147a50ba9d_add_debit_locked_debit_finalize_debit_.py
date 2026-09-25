"""add debit_locked, debit_finalize, debit_revert to ledgertype enum

Revision ID: dd147a50ba9d
Revises: 3aeb202d59bb
Create Date: 2026-09-25 20:32:01.478319

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dd147a50ba9d'
down_revision: Union[str, None] = '3aeb202d59bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Alembic's autogenerate doesn't diff native Postgres ENUM value changes,
    # so this has to be a hand-written ALTER TYPE ... ADD VALUE per member.
    # WalletService's lock/finalize/release trio referenced these three
    # LedgerType members before they existed on the enum at all.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE ledgertype ADD VALUE IF NOT EXISTS 'debit_locked'")
        op.execute("ALTER TYPE ledgertype ADD VALUE IF NOT EXISTS 'debit_finalize'")
        op.execute("ALTER TYPE ledgertype ADD VALUE IF NOT EXISTS 'debit_revert'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres has no DROP VALUE for enums short of recreating the type and
    # rewriting every dependent column — not worth it for a downgrade path.
    pass
