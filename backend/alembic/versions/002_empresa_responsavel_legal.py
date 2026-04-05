"""empresa: colunas responsavel legal

Revision ID: 002_resp_legal
Revises: 001_tipo_negocio
Create Date: 2026-03-29

"""
from alembic import op
import sqlalchemy as sa

revision = "002_resp_legal"
down_revision = "001_tipo_negocio"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("empresas", sa.Column("resp_legal_nome", sa.String(length=255), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_cpf", sa.String(length=14), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_rg", sa.String(length=20), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_orgao_emissor", sa.String(length=30), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_nacionalidade", sa.String(length=50), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_estado_civil", sa.String(length=30), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_cargo", sa.String(length=100), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_email", sa.String(length=255), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_telefone", sa.String(length=20), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_endereco", sa.String(length=255), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_numero", sa.String(length=20), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_complemento", sa.String(length=100), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_bairro", sa.String(length=100), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_cidade", sa.String(length=100), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_estado", sa.String(length=2), nullable=True))
    op.add_column("empresas", sa.Column("resp_legal_cep", sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column("empresas", "resp_legal_cep")
    op.drop_column("empresas", "resp_legal_estado")
    op.drop_column("empresas", "resp_legal_cidade")
    op.drop_column("empresas", "resp_legal_bairro")
    op.drop_column("empresas", "resp_legal_complemento")
    op.drop_column("empresas", "resp_legal_numero")
    op.drop_column("empresas", "resp_legal_endereco")
    op.drop_column("empresas", "resp_legal_telefone")
    op.drop_column("empresas", "resp_legal_email")
    op.drop_column("empresas", "resp_legal_cargo")
    op.drop_column("empresas", "resp_legal_estado_civil")
    op.drop_column("empresas", "resp_legal_nacionalidade")
    op.drop_column("empresas", "resp_legal_orgao_emissor")
    op.drop_column("empresas", "resp_legal_rg")
    op.drop_column("empresas", "resp_legal_cpf")
    op.drop_column("empresas", "resp_legal_nome")
