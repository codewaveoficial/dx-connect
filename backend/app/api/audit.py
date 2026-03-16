from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import AuditLog
from app.models.atendente import Atendente
from app.schemas.audit_log import AuditLogRead
from app.core.auth import exigir_admin

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=list[AuditLogRead])
def listar_audit(
    entity_type: str | None = Query(None, description="Filtrar por tipo: rede, empresa, setor, atendente, funcionario_rede, status_ticket"),
    entity_id: int | None = Query(None, description="Filtrar por ID do registro"),
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    q = db.query(AuditLog).options(joinedload(AuditLog.atendente)).order_by(AuditLog.created_at.desc())
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    if entity_id is not None:
        q = q.filter(AuditLog.entity_id == entity_id)
    q = q.limit(200)
    rows = q.all()
    return [
        AuditLogRead(
            id=r.id,
            entity_type=r.entity_type,
            entity_id=r.entity_id,
            action=r.action,
            atendente_id=r.atendente_id,
            atendente_nome=r.atendente.nome if r.atendente else None,
            created_at=r.created_at,
        )
        for r in rows
    ]
