from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import StatusTicket
from app.models.atendente import Atendente
from app.schemas.status_ticket import StatusTicketCreate, StatusTicketUpdate, StatusTicketRead
from app.core.auth import obter_atendente_atual, exigir_admin

router = APIRouter(prefix="/status-ticket", tags=["status-ticket"])


@router.get("", response_model=list[StatusTicketRead])
def listar(
    db: Session = Depends(get_db),
    _: Atendente = Depends(obter_atendente_atual),
):
    return db.query(StatusTicket).order_by(StatusTicket.ordem, StatusTicket.nome).all()


@router.post("", response_model=StatusTicketRead, status_code=201)
def criar(
    data: StatusTicketCreate,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    if db.query(StatusTicket).filter(StatusTicket.slug == data.slug).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug já existe")
    st = StatusTicket(**data.model_dump())
    db.add(st)
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
    _: Atendente = Depends(exigir_admin),
):
    st = db.query(StatusTicket).filter(StatusTicket.id == status_id).first()
    if not st:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Status não encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(st, k, v)
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
