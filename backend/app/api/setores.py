from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Setor
from app.models.atendente import Atendente
from app.schemas.setor import SetorCreate, SetorUpdate, SetorRead
from app.schemas.lista_paginada import ListaPaginada
from app.core.auth import obter_atendente_atual, exigir_admin
from app.core.audit import registrar_audit

router = APIRouter(prefix="/setores", tags=["setores"])

_MAX_PAGE = 100
_DEFAULT_PAGE = 20


@router.get("", response_model=ListaPaginada[SetorRead])
def listar_setores(
    incluir_inativos: bool = Query(False, description="Incluir setores inativos"),
    busca: str | None = Query(None, description="Filtra por nome"),
    offset: int = Query(0, ge=0),
    limit: int = Query(_DEFAULT_PAGE, ge=1, le=_MAX_PAGE),
    db: Session = Depends(get_db),
    _: Atendente = Depends(obter_atendente_atual),
):
    q = db.query(Setor)
    if not incluir_inativos:
        q = q.filter(Setor.ativo.is_(True))
    if busca and busca.strip():
        term = f"%{busca.strip()}%"
        q = q.filter(Setor.nome.ilike(term))
    total = q.count()
    items = q.order_by(Setor.nome).offset(offset).limit(limit).all()
    return ListaPaginada(items=items, total=total)


@router.post("", response_model=SetorRead, status_code=201)
def criar_setor(
    data: SetorCreate,
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(exigir_admin),
):
    if db.query(Setor).filter(Setor.slug == data.slug).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug já existe")
    setor = Setor(**data.model_dump())
    db.add(setor)
    db.flush()
    registrar_audit(db, "setor", setor.id, "create", atendente.id)
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
    atendente: Atendente = Depends(exigir_admin),
):
    setor = db.query(Setor).filter(Setor.id == setor_id).first()
    if not setor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(setor, k, v)
    registrar_audit(db, "setor", setor_id, "update", atendente.id)
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
