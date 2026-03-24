"""add is_discount to transactions

Revision ID: 8c1a9e1f4b2a
Revises: ea3469427717
Create Date: 2026-03-24 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "8c1a9e1f4b2a"
down_revision = "ea3469427717"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "transactions",
        sa.Column("is_discount", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("transactions", "is_discount", server_default=None)


def downgrade():
    op.drop_column("transactions", "is_discount")
