from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Rede, Empresa, FuncionarioRede, FuncionarioRedeEmpresa
from app.models.atendente import Atendente
from app.schemas.rede import RedeCreate, RedeUpdate, RedeRead
from app.schemas.funcionario_rede import FuncionarioRedeComVinculo
from app.core.auth import obter_atendente_atual, exigir_admin

router = APIRouter(prefix="/redes", tags=["redes"])


@router.get("", response_model=list[RedeRead])
def listar_redes(
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    return db.query(Rede).order_by(Rede.nome).all()


@router.post("", response_model=RedeRead, status_code=201)
def criar_rede(
    data: RedeCreate,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    rede = Rede(**data.model_dump())
    db.add(rede)
    db.commit()
    db.refresh(rede)
    return rede


@router.get("/{rede_id}/funcionarios", response_model=list[FuncionarioRedeComVinculo])
def listar_funcionarios_da_rede(
    rede_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    rede = db.query(Rede).filter(Rede.id == rede_id).first()
    if not rede:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rede não encontrada")
    ids_empresas_da_rede = [r[0] for r in db.query(Empresa.id).filter(Empresa.rede_id == rede_id).all()]
    # Sócios da rede, colaboradores de alguma empresa da rede, supervisores vinculados a alguma empresa da rede
    condicoes = [FuncionarioRede.rede_id == rede_id]
    if ids_empresas_da_rede:
        condicoes.append(FuncionarioRede.empresa_id.in_(ids_empresas_da_rede))
        condicoes.append(
            FuncionarioRede.id.in_(
                db.query(FuncionarioRedeEmpresa.funcionario_id).filter(
                    FuncionarioRedeEmpresa.empresa_id.in_(ids_empresas_da_rede)
                )
            )
        )
    q = db.query(FuncionarioRede).filter(or_(*condicoes)).order_by(FuncionarioRede.nome)
    result = []
    for f in q.all():
        if f.tipo == "socio":
            vinculado_a = "Sócio da rede"
        elif f.tipo == "colaborador" and f.empresa_id:
            emp = db.query(Empresa).filter(Empresa.id == f.empresa_id).first()
            vinculado_a = emp.nome if emp else "—"
        elif f.tipo == "supervisor":
            nomes = [
                e.empresa.nome
                for e in f.empresas_supervisor
                if e.empresa_id in ids_empresas_da_rede
            ]
            vinculado_a = ", ".join(nomes) if nomes else "—"
        else:
            vinculado_a = "—"
        result.append(
            FuncionarioRedeComVinculo(
                id=f.id,
                nome=f.nome,
                email=f.email,
                tipo=f.tipo,
                ativo=f.ativo,
                rede_id=f.rede_id,
                empresa_id=f.empresa_id,
                empresa_ids=[e.empresa_id for e in f.empresas_supervisor],
                created_at=f.created_at,
                updated_at=f.updated_at,
                vinculado_a=vinculado_a,
            )
        )
    return result


@router.get("/{rede_id}", response_model=RedeRead)
def obter_rede(
    rede_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    rede = db.query(Rede).filter(Rede.id == rede_id).first()
    if not rede:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rede não encontrada")
    return rede


@router.patch("/{rede_id}", response_model=RedeRead)
def atualizar_rede(
    rede_id: int,
    data: RedeUpdate,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    rede = db.query(Rede).filter(Rede.id == rede_id).first()
    if not rede:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rede não encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(rede, k, v)
    db.commit()
    db.refresh(rede)
    return rede


@router.delete("/{rede_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_rede(
    rede_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    rede = db.query(Rede).filter(Rede.id == rede_id).first()
    if not rede:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rede não encontrada")
    db.delete(rede)
    db.commit()
