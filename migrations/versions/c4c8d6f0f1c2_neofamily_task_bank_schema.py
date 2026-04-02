"""add neofamily task bank schema

Revision ID: c4c8d6f0f1c2
Revises: b1a44c6d92f3
Create Date: 2026-03-24 18:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c4c8d6f0f1c2"
down_revision = "b1a44c6d92f3"
branch_labels = None
depends_on = None


def _table_exists(inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _column_exists(inspector, table_name: str, column_name: str) -> bool:
    if not _table_exists(inspector, table_name):
        return False
    return column_name in {column["name"] for column in inspector.get_columns(table_name)}


def _index_exists(inspector, table_name: str, index_name: str) -> bool:
    if not _table_exists(inspector, table_name):
        return False
    indexes = inspector.get_indexes(table_name)
    return any(index.get("name") == index_name for index in indexes)


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _table_exists(inspector, "subjects"):
        if not _column_exists(inspector, "subjects", "color"):
            op.add_column("subjects", sa.Column("color", sa.String(length=20), nullable=True))
        if not _column_exists(inspector, "subjects", "external_id"):
            op.add_column("subjects", sa.Column("external_id", sa.Integer(), nullable=True))
        if not _column_exists(inspector, "subjects", "is_active"):
            op.add_column("subjects", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
        if not _column_exists(inspector, "subjects", "synced_at"):
            op.add_column("subjects", sa.Column("synced_at", sa.DateTime(), nullable=True))

    inspector = sa.inspect(bind)
    if _table_exists(inspector, "themes") and not _column_exists(inspector, "themes", "external_id"):
        op.add_column("themes", sa.Column("external_id", sa.Integer(), nullable=True))

    inspector = sa.inspect(bind)
    if _table_exists(inspector, "questions"):
        if not _column_exists(inspector, "questions", "html_text"):
            op.add_column("questions", sa.Column("html_text", sa.Text(), nullable=True))
        if not _column_exists(inspector, "questions", "solution_html"):
            op.add_column("questions", sa.Column("solution_html", sa.Text(), nullable=True))
        if not _column_exists(inspector, "questions", "external_id"):
            op.add_column("questions", sa.Column("external_id", sa.String(length=100), nullable=True))

    inspector = sa.inspect(bind)
    if not _table_exists(inspector, "banners"):
        op.create_table(
            "banners",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("subject_id", sa.Integer(), sa.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False),
            sa.Column("external_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=True),
            sa.Column("header", sa.String(length=500), nullable=True),
            sa.Column("url", sa.String(length=1000), nullable=True),
            sa.Column("display_order", sa.Integer(), nullable=True),
            sa.Column("duration", sa.Integer(), nullable=True),
            sa.Column("open_in_current_tab", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("position_name", sa.String(length=100), nullable=True),
            sa.Column("desktop_image_url", sa.String(length=1500), nullable=True),
            sa.Column("mobile_image_url", sa.String(length=1500), nullable=True),
            sa.Column("raw_payload", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.UniqueConstraint("external_id", name="uq_banners_external_id"),
        )

    inspector = sa.inspect(bind)
    if _table_exists(inspector, "subjects") and not _index_exists(inspector, "subjects", "idx_subject_external_id"):
        op.create_index("idx_subject_external_id", "subjects", ["external_id"], unique=False)

    inspector = sa.inspect(bind)
    if _table_exists(inspector, "themes") and not _index_exists(inspector, "themes", "idx_theme_subject_external_id"):
        op.create_index("idx_theme_subject_external_id", "themes", ["subject_id", "external_id"], unique=False)

    inspector = sa.inspect(bind)
    if _table_exists(inspector, "questions") and not _index_exists(inspector, "questions", "idx_question_external_id"):
        op.create_index("idx_question_external_id", "questions", ["external_id"], unique=False)

    inspector = sa.inspect(bind)
    if _table_exists(inspector, "banners") and not _index_exists(inspector, "banners", "idx_banner_subject_id"):
        op.create_index("idx_banner_subject_id", "banners", ["subject_id"], unique=False)

    if bind.dialect.name != "sqlite" and _column_exists(inspector, "subjects", "is_active"):
        op.alter_column("subjects", "is_active", server_default=None)


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _index_exists(inspector, "banners", "idx_banner_subject_id"):
        op.drop_index("idx_banner_subject_id", table_name="banners")

    if _table_exists(inspector, "banners"):
        op.drop_table("banners")

    if _index_exists(inspector, "questions", "idx_question_external_id"):
        op.drop_index("idx_question_external_id", table_name="questions")

    if _index_exists(inspector, "themes", "idx_theme_subject_external_id"):
        op.drop_index("idx_theme_subject_external_id", table_name="themes")

    if _index_exists(inspector, "subjects", "idx_subject_external_id"):
        op.drop_index("idx_subject_external_id", table_name="subjects")

    if bind.dialect.name == "sqlite":
        return

    inspector = sa.inspect(bind)
    if _column_exists(inspector, "questions", "external_id"):
        op.drop_column("questions", "external_id")
    if _column_exists(inspector, "questions", "solution_html"):
        op.drop_column("questions", "solution_html")
    if _column_exists(inspector, "questions", "html_text"):
        op.drop_column("questions", "html_text")

    inspector = sa.inspect(bind)
    if _column_exists(inspector, "themes", "external_id"):
        op.drop_column("themes", "external_id")

    inspector = sa.inspect(bind)
    if _column_exists(inspector, "subjects", "synced_at"):
        op.drop_column("subjects", "synced_at")
    if _column_exists(inspector, "subjects", "is_active"):
        op.drop_column("subjects", "is_active")
    if _column_exists(inspector, "subjects", "external_id"):
        op.drop_column("subjects", "external_id")
    if _column_exists(inspector, "subjects", "color"):
        op.drop_column("subjects", "color")
