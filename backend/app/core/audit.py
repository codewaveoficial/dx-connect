"""Registro de auditoria: quem fez e quando."""

from sqlalchemy.orm import Session

from app.models import AuditLog


def registrar_audit(
    db: Session,
    entity_type: str,
    entity_id: int,
    action: str,
    atendente_id: int | None,
) -> None:
    db.add(
        AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            atendente_id=atendente_id,
        )
    )
