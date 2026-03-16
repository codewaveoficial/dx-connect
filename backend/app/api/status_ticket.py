from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import StatusTicket
from app.models.atendente import Atendente
from app.schemas.status_ticket import StatusTicketCreate, StatusTicketUpdate, StatusTicketRead
from app.core.auth import obter_atendente_atual, exigir_admin
from app.core.audit import registrar_audit

router = APIRouter(prefix="/status-ticket", tags=["status-ticket"])


@router.get("", response_model=list[StatusTicketRead])
def listar(
    incluir_inativos: bool = Query(False, description="Incluir status inativos"),
    db: Session = Depends(get_db),
    _: Atendente = Depends(obter_atendente_atual),
):
    q = db.query(StatusTicket).order_by(StatusTicket.ordem, StatusTicket.nome)
    if not incluir_inativos:
        q = q.filter(StatusTicket.ativo.is_(True))
    return q.all()


@router.post("", response_model=StatusTicketRead, status_code=201)
def criar(
    data: StatusTicketCreate,
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(exigir_admin),
):
    if db.query(StatusTicket).filter(StatusTicket.slug == data.slug).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug já existe")
    st = StatusTicket(**data.model_dump())
    db.add(st)
    db.flush()
    registrar_audit(db, "status_ticket", st.id, "create", atendente.id)
    db.commit()
    db.refresh(st)
    return st


@router.get("/{status_id}", response_model=StatusTicketRead)
def obter(
    status_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    st = db.query(StatusTicket).filter(StatusTicket.id == status_id).first()
    if not st:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Status não encontrado")
    return st


@router.patch("/{status_id}", response_model=StatusTicketRead)
def atualizar(
    status_id: int,
    data: StatusTicketUpdate,
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(exigir_admin),
):
    st = db.query(StatusTicket).filter(StatusTicket.id == status_id).first()
    if not st:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Status não encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(st, k, v)
    registrar_audit(db, "status_ticket", status_id, "update", atendente.id)
    db.commit()
    db.refresh(st)
    return st


@router.delete("/{status_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir(
    status_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    st = db.query(StatusTicket).filter(StatusTicket.id == status_id).first()
    if not st:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Status não encontrado")
    db.delete(st)
    db.commit()
