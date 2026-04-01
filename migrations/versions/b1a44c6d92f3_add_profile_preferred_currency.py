"""add preferred currency to user profile

Revision ID: b1a44c6d92f3
Revises: 8c1a9e1f4b2a
Create Date: 2026-03-24 13:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b1a44c6d92f3"
down_revision = "8c1a9e1f4b2a"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("user_profiles")}

    if "preferred_currency" not in existing:
        op.add_column(
            "user_profiles",
            sa.Column("preferred_currency", sa.String(length=3), nullable=False, server_default="RUB"),
        )

    if bind.dialect.name != "sqlite":
        op.alter_column("user_profiles", "preferred_currency", server_default=None)


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("user_profiles")}

    if "preferred_currency" in existing:
        op.drop_column("user_profiles", "preferred_currency")
