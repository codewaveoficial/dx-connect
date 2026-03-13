from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    rede_id = Column(Integer, ForeignKey("redes.id"), nullable=False)
    nome = Column(String(255), nullable=False)
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    rede = relationship("Rede", back_populates="empresas")
    tickets = relationship("Ticket", back_populates="empresa")
    colaboradores = relationship("FuncionarioRede", back_populates="empresa", foreign_keys="FuncionarioRede.empresa_id")
    empresas_supervisor = relationship("FuncionarioRedeEmpresa", back_populates="empresa", foreign_keys="FuncionarioRedeEmpresa.empresa_id")
