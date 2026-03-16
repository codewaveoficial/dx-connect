"""add tipo_negocio_id to empresas

Revision ID: 001_tipo_negocio
Revises:
Create Date: add column tipo_negocio_id to empresas

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "001_tipo_negocio"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "empresas",
        sa.Column("tipo_negocio_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "empresas_tipo_negocio_id_fkey",
        "empresas",
        "tipos_negocio",
        ["tipo_negocio_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("empresas_tipo_negocio_id_fkey", "empresas", type_="foreignkey")
    op.drop_column("empresas", "tipo_negocio_id")
