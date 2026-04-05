from sqlalchemy import Column, Integer, String

from app.database import Base


class IbgeMunicipio(Base):
    """Municípios brasileiros (cache local, sincronizado com o IBGE)."""

    __tablename__ = "ibge_municipios"

    codigo_ibge = Column(Integer, primary_key=True, autoincrement=False)
    uf_sigla = Column(String(2), nullable=False, index=True)
    nome = Column(String(255), nullable=False)
