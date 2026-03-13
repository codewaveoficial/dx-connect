from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Atendente, Setor
from app.schemas.atendente import AtendenteCreate, AtendenteRead, AtendenteUpdate
from app.core.auth import exigir_admin, obter_atendente_atual
from app.core.security import hash_senha

router = APIRouter(prefix="/atendentes", tags=["atendentes"])


def _atendente_para_read(atendente: Atendente) -> AtendenteRead:
    return AtendenteRead(
        id=atendente.id,
        email=atendente.email,
        nome=atendente.nome,
        role=atendente.role,
        ativo=atendente.ativo,
        created_at=atendente.created_at,
        updated_at=atendente.updated_at,
        setor_ids=[s.id for s in atendente.setores],
    )


@router.get("", response_model=list[AtendenteRead])
def listar_atendentes(
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    atendentes = db.query(Atendente).order_by(Atendente.nome).all()
    return [_atendente_para_read(a) for a in atendentes]


@router.post("", response_model=AtendenteRead, status_code=201)
def criar_atendente(
    data: AtendenteCreate,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    if db.query(Atendente).filter(Atendente.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já cadastrado")
    atendente = Atendente(
        email=data.email,
        nome=data.nome,
        senha_hash=hash_senha(data.senha),
        role=data.role,
        ativo=data.ativo,
    )
    db.add(atendente)
    db.flush()
    for setor_id in data.setor_ids:
        setor = db.query(Setor).filter(Setor.id == setor_id).first()
        if setor:
            atendente.setores.append(setor)
    db.commit()
    db.refresh(atendente)
    return _atendente_para_read(atendente)


@router.get("/me", response_model=AtendenteRead)
def me(atendente: Atendente = Depends(obter_atendente_atual)):
    return _atendente_para_read(atendente)


@router.get("/{atendente_id}", response_model=AtendenteRead)
def obter_atendente(
    atendente_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    atendente = db.query(Atendente).filter(Atendente.id == atendente_id).first()
    if not atendente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Atendente não encontrado")
    return _atendente_para_read(atendente)


@router.patch("/{atendente_id}", response_model=AtendenteRead)
def atualizar_atendente(
    atendente_id: int,
    data: AtendenteUpdate,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    atendente = db.query(Atendente).filter(Atendente.id == atendente_id).first()
    if not atendente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Atendente não encontrado")
    update = data.model_dump(exclude_unset=True)
    if "senha" in update and update["senha"]:
        atendente.senha_hash = hash_senha(update.pop("senha"))
    if "setor_ids" in update:
        setor_ids = update.pop("setor_ids")
        atendente.setores.clear()
        for setor_id in setor_ids:
            setor = db.query(Setor).filter(Setor.id == setor_id).first()
            if setor:
                atendente.setores.append(setor)
    for k, v in update.items():
        setattr(atendente, k, v)
    db.commit()
    db.refresh(atendente)
    return _atendente_para_read(atendente)


@router.delete("/{atendente_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_atendente(
    atendente_id: int,
    db: Session = Depends(get_db),
    _: Atendente = Depends(exigir_admin),
):
    atendente = db.query(Atendente).filter(Atendente.id == atendente_id).first()
    if not atendente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Atendente não encontrado")
    db.delete(atendente)
    db.commit()
