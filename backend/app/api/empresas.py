from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Empresa, Rede
from app.models.atendente import Atendente
from app.schemas.empresa import EmpresaCreate, EmpresaUpdate, EmpresaRead
from app.core.auth import exigir_admin, obter_atendente_atual

router = APIRouter(prefix="/empresas", tags=["empresas"])


def _pode_ver_empresa(atendente: Atendente, empresa_id: int, db: Session) -> bool:
    if atendente.role == "admin":
        return True
    setor_ids = [s.id for s in atendente.setores]
    # Atendente vê empresa se existir ticket da empresa no seu setor (ou filtramos por empresa nos tickets)
    # Na prática: admin vê todas; atendente vê empresas que têm tickets no seu setor.
    # Para listar empresas: admin vê todas; atendente pode ver apenas "suas" empresas (onde tem ticket).
    # Simplificando: apenas admin gerencia empresas. Atendente não lista empresas diretamente.
    return False


@router.get("", response_model=list[EmpresaRead])
def listar_empresas(
    rede_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _: Atendente = Depends(obter_atendente_atual),
):
    q = db.query(Empresa).order_by(Empresa.nome)
    if rede_id is not None:
        q = q.filter(Empresa.rede_id == rede_id)
    return q.all()


@router.post("", response_model=EmpresaRead, status_code=201)
def criar_empresa(
    data: EmpresaCreate,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    rede = db.query(Rede).filter(Rede.id == data.rede_id).first()
    if not rede:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rede não encontrada")
    empresa = Empresa(**data.model_dump())
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return empresa


@router.get("/{empresa_id}", response_model=EmpresaRead)
def obter_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada")
    return empresa


@router.patch("/{empresa_id}", response_model=EmpresaRead)
def atualizar_empresa(
    empresa_id: int,
    data: EmpresaUpdate,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(empresa, k, v)
    db.commit()
    db.refresh(empresa)
    return empresa


@router.delete("/{empresa_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada")
    db.delete(empresa)
    db.commit()
