"""atendentes.must_change_password

Revision ID: 004_must_pwd
Revises: 003_ibge_mun
Create Date: 2026-04-11

"""
from alembic import op
import sqlalchemy as sa

revision = "004_must_pwd"
down_revision = "003_ibge_mun"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "atendentes",
        sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.alter_column("atendentes", "must_change_password", server_default=None)


def downgrade() -> None:
    op.drop_column("atendentes", "must_change_password")
