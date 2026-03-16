"""Registro de quem fez e quando em cadastros e alterações."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # rede, empresa, setor, atendente, funcionario_rede, status_ticket
    entity_id = Column(Integer, nullable=False, index=True)
    action = Column(String(20), nullable=False)  # create, update
    atendente_id = Column(Integer, ForeignKey("atendentes.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    atendente = relationship("Atendente", backref="audit_logs")
