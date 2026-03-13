from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Setor
from app.models.atendente import Atendente
from app.schemas.setor import SetorCreate, SetorUpdate, SetorRead
from app.core.auth import obter_atendente_atual, exigir_admin

router = APIRouter(prefix="/setores", tags=["setores"])


@router.get("", response_model=list[SetorRead])
def listar_setores(
    db: Session = Depends(get_db),
    _: Atendente = Depends(obter_atendente_atual),
):
    return db.query(Setor).order_by(Setor.nome).all()


@router.post("", response_model=SetorRead, status_code=201)
def criar_setor(
    data: SetorCreate,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    if db.query(Setor).filter(Setor.slug == data.slug).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug já existe")
    setor = Setor(**data.model_dump())
    db.add(setor)
    db.commit()
    db.refresh(setor)
    return setor


@router.get("/{setor_id}", response_model=SetorRead)
def obter_setor(
    setor_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    setor = db.query(Setor).filter(Setor.id == setor_id).first()
    if not setor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado")
    return setor


@router.patch("/{setor_id}", response_model=SetorRead)
def atualizar_setor(
    setor_id: int,
    data: SetorUpdate,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    setor = db.query(Setor).filter(Setor.id == setor_id).first()
    if not setor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(setor, k, v)
    db.commit()
    db.refresh(setor)
    return setor


@router.delete("/{setor_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_setor(
    setor_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    setor = db.query(Setor).filter(Setor.id == setor_id).first()
    if not setor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado")
    db.delete(setor)
    db.commit()
