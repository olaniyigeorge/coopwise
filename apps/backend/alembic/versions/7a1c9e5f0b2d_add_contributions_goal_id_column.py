"""add contributions.goal_id column

Revision ID: 7a1c9e5f0b2d
Revises: 30821cca62a5
Create Date: 2026-09-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a1c9e5f0b2d'
down_revision: Union[str, None] = '30821cca62a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'contributions',
        sa.Column('goal_id', sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        'fk_contributions_goal_id_coop_goals',
        'contributions',
        'coop_goals',
        ['goal_id'],
        ['id'],
    )
    op.create_index(
        op.f('ix_contributions_goal_id'), 'contributions', ['goal_id'], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_contributions_goal_id'), table_name='contributions')
    op.drop_constraint(
        'fk_contributions_goal_id_coop_goals', 'contributions', type_='foreignkey'
    )
    op.drop_column('contributions', 'goal_id')
