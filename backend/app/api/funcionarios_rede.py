from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import FuncionarioRede, FuncionarioRedeEmpresa, Ticket
from app.models.atendente import Atendente
from app.schemas.funcionario_rede import FuncionarioRedeCreate, FuncionarioRedeUpdate, FuncionarioRedeRead
from app.core.auth import exigir_admin
from app.core.audit import registrar_audit

router = APIRouter(prefix="/funcionarios-rede", tags=["funcionarios-rede"])


def _para_read(f: FuncionarioRede) -> FuncionarioRedeRead:
    empresa_ids = [e.empresa_id for e in f.empresas_supervisor] if f.tipo == "supervisor" else []
    return FuncionarioRedeRead(
        id=f.id,
        nome=f.nome,
        email=f.email,
        tipo=f.tipo,
        ativo=f.ativo,
        rede_id=f.rede_id,
        empresa_id=f.empresa_id,
        empresa_ids=empresa_ids,
        created_at=f.created_at,
        updated_at=f.updated_at,
    )


@router.get("", response_model=list[FuncionarioRedeRead])
def listar(
    rede_id: int | None = Query(None),
    empresa_id: int | None = Query(None),
    tipo: str | None = Query(None),
    incluir_inativos: bool = Query(False, description="Incluir funcionários inativos"),
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    q = db.query(FuncionarioRede).order_by(FuncionarioRede.nome)
    if rede_id is not None:
        q = q.filter(FuncionarioRede.rede_id == rede_id)
    if empresa_id is not None:
        q = q.filter(
            (FuncionarioRede.empresa_id == empresa_id) |
            (FuncionarioRede.id.in_(
                db.query(FuncionarioRedeEmpresa.funcionario_id).filter(
                    FuncionarioRedeEmpresa.empresa_id == empresa_id
                )
            ))
        )
    if tipo:
        q = q.filter(FuncionarioRede.tipo == tipo)
    if not incluir_inativos:
        q = q.filter(FuncionarioRede.ativo.is_(True))
    return [_para_read(f) for f in q.all()]


@router.post("", response_model=FuncionarioRedeRead, status_code=201)
def criar(
    data: FuncionarioRedeCreate,
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(exigir_admin),
):
    if data.tipo == "socio" and not data.rede_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sócio deve ter rede_id")
    if data.tipo == "colaborador" and not data.empresa_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Colaborador deve ter empresa_id")
    if data.tipo == "supervisor" and not data.empresa_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supervisor deve ter ao menos uma empresa")
    f = FuncionarioRede(
        nome=data.nome,
        email=data.email,
        tipo=data.tipo,
        ativo=data.ativo,
        rede_id=data.rede_id,
        empresa_id=data.empresa_id,
    )
    db.add(f)
    db.flush()
    registrar_audit(db, "funcionario_rede", f.id, "create", atendente.id)
    if data.tipo == "supervisor":
        for emp_id in data.empresa_ids:
            db.add(FuncionarioRedeEmpresa(funcionario_id=f.id, empresa_id=emp_id))
    db.commit()
    db.refresh(f)
    return _para_read(f)


@router.get("/{funcionario_id}", response_model=FuncionarioRedeRead)
def obter(
    funcionario_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    f = db.query(FuncionarioRede).filter(FuncionarioRede.id == funcionario_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado")
    return _para_read(f)


@router.patch("/{funcionario_id}", response_model=FuncionarioRedeRead)
def atualizar(
    funcionario_id: int,
    data: FuncionarioRedeUpdate,
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(exigir_admin),
):
    f = db.query(FuncionarioRede).filter(FuncionarioRede.id == funcionario_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado")
    update = data.model_dump(exclude_unset=True)
    empresa_ids = update.pop("empresa_ids", None)
    for k, v in update.items():
        setattr(f, k, v)
    if empresa_ids is not None and f.tipo == "supervisor":
        db.query(FuncionarioRedeEmpresa).filter(FuncionarioRedeEmpresa.funcionario_id == f.id).delete()
        for emp_id in empresa_ids:
            db.add(FuncionarioRedeEmpresa(funcionario_id=f.id, empresa_id=emp_id))
    registrar_audit(db, "funcionario_rede", funcionario_id, "update", atendente.id)
    db.commit()
    db.refresh(f)
    return _para_read(f)


@router.delete("/{funcionario_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir(
    funcionario_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    f = db.query(FuncionarioRede).filter(FuncionarioRede.id == funcionario_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado")
    tickets_vinculados = db.query(Ticket).filter(Ticket.aberto_por_id == funcionario_id).count()
    if tickets_vinculados > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir funcionário vinculado a ticket(s). Sugere-se inativar o registro.",
        )
    db.delete(f)
    db.commit()
