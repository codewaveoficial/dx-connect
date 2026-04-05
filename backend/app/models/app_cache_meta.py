from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func

from app.database import Base


class AppCacheMeta(Base):
    """Metadados de caches populados pelo servidor (ex.: última sync IBGE)."""

    __tablename__ = "app_cache_meta"

    chave = Column(String(64), primary_key=True)
    atualizado_em = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
