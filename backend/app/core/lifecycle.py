"""Regras de inicialização: desenvolvimento vs produção (schema / migrations)."""

from __future__ import annotations

import logging
import sys
from typing import TYPE_CHECKING

from sqlalchemy import text
from sqlalchemy.exc import DatabaseError, OperationalError, ProgrammingError

if TYPE_CHECKING:
    from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def dev_create_all_tables(engine: Engine, metadata) -> None:
    """Em desenvolvimento, garante tabelas a partir dos models (complementa Alembic local)."""
    metadata.create_all(bind=engine)
    logger.info("Desenvolvimento: SQLAlchemy create_all executado.")


def production_require_alembic(engine: Engine) -> None:
    """
    Em produção, exige que o Alembic tenha sido aplicado (tabela alembic_version com revisão).
    Evita subir a API com schema inexistente ou dessincronizado com create_all.
    """
    try:
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version_num FROM alembic_version LIMIT 1")).scalar()
    except (ProgrammingError, OperationalError) as e:
        logger.critical(
            "Produção: não foi possível ler alembic_version. "
            "Aplique as migrations antes de iniciar: alembic upgrade head. Erro: %s",
            e,
        )
        sys.exit(1)
    except DatabaseError as e:
        logger.critical(
            "Produção: erro ao verificar migrations (banco inacessível ou schema inesperado): %s",
            e,
        )
        sys.exit(1)

    if not version or not str(version).strip():
        logger.critical(
            "Produção: alembic_version existe mas está vazio. Rode: alembic upgrade head"
        )
        sys.exit(1)

    logger.info("Produção: schema via Alembic (revisão atual: %s).", version)
