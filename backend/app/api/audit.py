from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import AuditLog
from app.models.atendente import Atendente
from app.schemas.audit_log import AuditLogRead
from app.schemas.lista_paginada import ListaPaginada
from app.core.auth import exigir_admin

router = APIRouter(prefix="/audit", tags=["audit"])

_MAX_PAGE = 100
_DEFAULT_PAGE = 20


@router.get("", response_model=ListaPaginada[AuditLogRead])
def listar_audit(
    entity_type: str | None = Query(None, description="Filtrar por tipo: rede, empresa, setor, atendente, funcionario_rede, status_ticket"),
    entity_id: int | None = Query(None, description="Filtrar por ID do registro"),
    busca: str | None = Query(None, description="Tipo de entidade ou nome do atendente"),
    offset: int = Query(0, ge=0),
    limit: int = Query(_DEFAULT_PAGE, ge=1, le=_MAX_PAGE),
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    q = db.query(AuditLog).options(joinedload(AuditLog.atendente))
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    if entity_id is not None:
        q = q.filter(AuditLog.entity_id == entity_id)
    if busca and busca.strip():
        term = f"%{busca.strip()}%"
        atendente_ids = db.query(Atendente.id).filter(Atendente.nome.ilike(term))
        q = q.filter(or_(AuditLog.entity_type.ilike(term), AuditLog.atendente_id.in_(atendente_ids)))
    total = q.count()
    rows = q.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    items = [
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
    return ListaPaginada(items=items, total=total)
