"""Schema inicial (tabelas base antes das migrations incrementais).

Revision ID: 000_initial_schema
Revises:
Create Date: 2026-04-11

Bancos criados só com create_all em dev não tinham baseline Alembic; 001+ assumiam
tabelas existentes. Instalações novas precisam desta revisão antes de 001.
"""
from alembic import op
import sqlalchemy as sa


revision = "000_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "redes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_redes_id"), "redes", ["id"], unique=False)

    op.create_table(
        "tipos_negocio",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=100), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tipos_negocio_id"), "tipos_negocio", ["id"], unique=False)

    op.create_table(
        "empresas",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("rede_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("cnpj_cpf", sa.String(length=18), nullable=True),
        sa.Column("razao_social", sa.String(length=255), nullable=True),
        sa.Column("nome_fantasia", sa.String(length=255), nullable=True),
        sa.Column("inscricao_estadual", sa.String(length=20), nullable=True),
        sa.Column("endereco", sa.String(length=255), nullable=True),
        sa.Column("numero", sa.String(length=20), nullable=True),
        sa.Column("complemento", sa.String(length=100), nullable=True),
        sa.Column("bairro", sa.String(length=100), nullable=True),
        sa.Column("cidade", sa.String(length=100), nullable=True),
        sa.Column("estado", sa.String(length=2), nullable=True),
        sa.Column("cep", sa.String(length=10), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("telefone", sa.String(length=20), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["rede_id"], ["redes.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_empresas_cnpj_cpf"), "empresas", ["cnpj_cpf"], unique=False)
    op.create_index(op.f("ix_empresas_id"), "empresas", ["id"], unique=False)

    op.create_table(
        "setores",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_setores_id"), "setores", ["id"], unique=False)

    op.create_table(
        "atendentes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("senha_hash", sa.String(length=255), nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_atendentes_id"), "atendentes", ["id"], unique=False)

    op.create_table(
        "atendente_setor",
        sa.Column("atendente_id", sa.Integer(), nullable=False),
        sa.Column("setor_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["atendente_id"], ["atendentes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["setor_id"], ["setores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("atendente_id", "setor_id"),
    )

    op.create_table(
        "status_ticket",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("ordem", sa.SmallInteger(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_status_ticket_id"), "status_ticket", ["id"], unique=False)

    op.create_table(
        "funcionarios_rede",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=True),
        sa.Column("rede_id", sa.Integer(), nullable=True),
        sa.Column("empresa_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"]),
        sa.ForeignKeyConstraint(["rede_id"], ["redes.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_funcionarios_rede_email"), "funcionarios_rede", ["email"], unique=False)
    op.create_index(op.f("ix_funcionarios_rede_id"), "funcionarios_rede", ["id"], unique=False)

    op.create_table(
        "funcionario_rede_empresa",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("funcionario_id", sa.Integer(), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["funcionario_id"], ["funcionarios_rede.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_funcionario_rede_empresa_id"), "funcionario_rede_empresa", ["id"], unique=False)

    op.create_table(
        "tickets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("protocolo", sa.String(length=20), nullable=False),
        sa.Column("empresa_id", sa.Integer(), nullable=False),
        sa.Column("setor_id", sa.Integer(), nullable=False),
        sa.Column("status_id", sa.Integer(), nullable=False),
        sa.Column("atendente_id", sa.Integer(), nullable=True),
        sa.Column("aberto_por_id", sa.Integer(), nullable=True),
        sa.Column("assunto", sa.String(length=500), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("fechado_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["aberto_por_id"], ["funcionarios_rede.id"]),
        sa.ForeignKeyConstraint(["atendente_id"], ["atendentes.id"]),
        sa.ForeignKeyConstraint(["empresa_id"], ["empresas.id"]),
        sa.ForeignKeyConstraint(["setor_id"], ["setores.id"]),
        sa.ForeignKeyConstraint(["status_id"], ["status_ticket.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("protocolo"),
    )
    op.create_index(op.f("ix_tickets_id"), "tickets", ["id"], unique=False)

    op.create_table(
        "ticket_mensagens",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ticket_id", sa.Integer(), nullable=False),
        sa.Column("atendente_id", sa.Integer(), nullable=True),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("corpo", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["atendente_id"], ["atendentes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ticket_mensagens_id"), "ticket_mensagens", ["id"], unique=False)
    op.create_index(op.f("ix_ticket_mensagens_ticket_id"), "ticket_mensagens", ["ticket_id"], unique=False)

    op.create_table(
        "ticket_historico",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ticket_id", sa.Integer(), nullable=False),
        sa.Column("atendente_id", sa.Integer(), nullable=True),
        sa.Column("campo", sa.String(length=50), nullable=False),
        sa.Column("valor_antigo", sa.Text(), nullable=True),
        sa.Column("valor_novo", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["atendente_id"], ["atendentes.id"]),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ticket_historico_id"), "ticket_historico", ["id"], unique=False)

    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=20), nullable=False),
        sa.Column("atendente_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["atendente_id"], ["atendentes.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_log_entity_id"), "audit_log", ["entity_id"], unique=False)
    op.create_index(op.f("ix_audit_log_entity_type"), "audit_log", ["entity_type"], unique=False)
    op.create_index(op.f("ix_audit_log_id"), "audit_log", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_log_id"), table_name="audit_log")
    op.drop_index(op.f("ix_audit_log_entity_type"), table_name="audit_log")
    op.drop_index(op.f("ix_audit_log_entity_id"), table_name="audit_log")
    op.drop_table("audit_log")

    op.drop_index(op.f("ix_ticket_historico_id"), table_name="ticket_historico")
    op.drop_table("ticket_historico")

    op.drop_index(op.f("ix_ticket_mensagens_ticket_id"), table_name="ticket_mensagens")
    op.drop_index(op.f("ix_ticket_mensagens_id"), table_name="ticket_mensagens")
    op.drop_table("ticket_mensagens")

    op.drop_index(op.f("ix_tickets_id"), table_name="tickets")
    op.drop_table("tickets")

    op.drop_index(op.f("ix_funcionario_rede_empresa_id"), table_name="funcionario_rede_empresa")
    op.drop_table("funcionario_rede_empresa")

    op.drop_index(op.f("ix_funcionarios_rede_id"), table_name="funcionarios_rede")
    op.drop_index(op.f("ix_funcionarios_rede_email"), table_name="funcionarios_rede")
    op.drop_table("funcionarios_rede")

    op.drop_index(op.f("ix_status_ticket_id"), table_name="status_ticket")
    op.drop_table("status_ticket")

    op.drop_table("atendente_setor")

    op.drop_index(op.f("ix_atendentes_id"), table_name="atendentes")
    op.drop_table("atendentes")

    op.drop_index(op.f("ix_setores_id"), table_name="setores")
    op.drop_table("setores")

    op.drop_index(op.f("ix_empresas_id"), table_name="empresas")
    op.drop_index(op.f("ix_empresas_cnpj_cpf"), table_name="empresas")
    op.drop_table("empresas")

    op.drop_index(op.f("ix_tipos_negocio_id"), table_name="tipos_negocio")
    op.drop_table("tipos_negocio")

    op.drop_index(op.f("ix_redes_id"), table_name="redes")
    op.drop_table("redes")
