from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TipoNegocio
from app.models.atendente import Atendente
from app.schemas.tipo_negocio import TipoNegocioCreate, TipoNegocioUpdate, TipoNegocioRead
from app.schemas.lista_paginada import ListaPaginada
from app.core.auth import obter_atendente_atual, exigir_admin
from app.core.audit import registrar_audit

router = APIRouter(prefix="/tipos-negocio", tags=["tipos-negocio"])

_MAX_PAGE = 100
_DEFAULT_PAGE = 20


@router.get("", response_model=ListaPaginada[TipoNegocioRead])
def listar(
    incluir_inativos: bool = Query(False, description="Incluir tipos inativos"),
    busca: str | None = Query(None, description="Filtra por nome"),
    offset: int = Query(0, ge=0),
    limit: int = Query(_DEFAULT_PAGE, ge=1, le=_MAX_PAGE),
    db: Session = Depends(get_db),
    _: Atendente = Depends(obter_atendente_atual),
):
    q = db.query(TipoNegocio)
    if not incluir_inativos:
        q = q.filter(TipoNegocio.ativo.is_(True))
    if busca and busca.strip():
        term = f"%{busca.strip()}%"
        q = q.filter(TipoNegocio.nome.ilike(term))
    total = q.count()
    items = q.order_by(TipoNegocio.nome).offset(offset).limit(limit).all()
    return ListaPaginada(items=items, total=total)


@router.post("", response_model=TipoNegocioRead, status_code=201)
def criar(
    data: TipoNegocioCreate,
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(exigir_admin),
):
    t = TipoNegocio(**data.model_dump())
    db.add(t)
    db.flush()
    registrar_audit(db, "tipo_negocio", t.id, "create", atendente.id)
    db.commit()
    db.refresh(t)
    return t


@router.get("/{tipo_id}", response_model=TipoNegocioRead)
def obter(
    tipo_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    t = db.query(TipoNegocio).filter(TipoNegocio.id == tipo_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tipo de negócio não encontrado")
    return t


@router.patch("/{tipo_id}", response_model=TipoNegocioRead)
def atualizar(
    tipo_id: int,
    data: TipoNegocioUpdate,
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(exigir_admin),
):
    t = db.query(TipoNegocio).filter(TipoNegocio.id == tipo_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tipo de negócio não encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    registrar_audit(db, "tipo_negocio", tipo_id, "update", atendente.id)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{tipo_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir(
    tipo_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    t = db.query(TipoNegocio).filter(TipoNegocio.id == tipo_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tipo de negócio não encontrado")
    db.delete(t)
    db.commit()
