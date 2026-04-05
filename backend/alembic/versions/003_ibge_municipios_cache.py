"""cache ibge municipios + app_cache_meta

Revision ID: 003_ibge_mun
Revises: 002_resp_legal
Create Date: 2026-03-29

"""
from alembic import op
import sqlalchemy as sa

revision = "003_ibge_mun"
down_revision = "002_resp_legal"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ibge_municipios",
        sa.Column("codigo_ibge", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("uf_sigla", sa.String(length=2), nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("codigo_ibge"),
    )
    op.create_index("ix_ibge_municipios_uf_sigla", "ibge_municipios", ["uf_sigla"], unique=False)

    op.create_table(
        "app_cache_meta",
        sa.Column("chave", sa.String(length=64), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("chave"),
    )


def downgrade() -> None:
    op.drop_table("app_cache_meta")
    op.drop_index("ix_ibge_municipios_uf_sigla", table_name="ibge_municipios")
    op.drop_table("ibge_municipios")
