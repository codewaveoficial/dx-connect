from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Ticket, TicketHistorico, Empresa, Setor, StatusTicket, Atendente
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketRead, TicketHistoricoRead
from app.core.auth import obter_atendente_atual, exigir_admin

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _gerar_protocolo(db: Session) -> str:
    """Gera próximo número de protocolo único (sequencial global)."""
    from sqlalchemy import func
    r = db.query(func.max(Ticket.id)).scalar() or 0
    return str(10000 + r + 1)


def _ticket_para_read(t: Ticket) -> TicketRead:
    return TicketRead(
        id=t.id,
        protocolo=t.protocolo,
        empresa_id=t.empresa_id,
        setor_id=t.setor_id,
        status_id=t.status_id,
        atendente_id=t.atendente_id,
        aberto_por_id=t.aberto_por_id,
        assunto=t.assunto,
        descricao=t.descricao,
        fechado_em=t.fechado_em,
        created_at=t.created_at,
        updated_at=t.updated_at,
        empresa_nome=t.empresa.nome if t.empresa else None,
        setor_nome=t.setor.nome if t.setor else None,
        status_nome=t.status.nome if t.status else None,
        atendente_nome=t.atendente.nome if t.atendente else None,
    )


def _pode_ver_ticket(atendente: Atendente, ticket: Ticket) -> bool:
    if atendente.role == "admin":
        return True
    setor_ids = [s.id for s in atendente.setores]
    return ticket.setor_id in setor_ids


@router.get("", response_model=list[TicketRead])
def listar(
    empresa_id: int | None = Query(None),
    setor_id: int | None = Query(None),
    status_id: int | None = Query(None),
    protocolo: str | None = Query(None),
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(obter_atendente_atual),
):
    q = db.query(Ticket).join(Ticket.empresa).join(Ticket.setor).join(Ticket.status)
    if atendente.role != "admin":
        setor_ids = [s.id for s in atendente.setores]
        q = q.filter(Ticket.setor_id.in_(setor_ids))
    if empresa_id is not None:
        q = q.filter(Ticket.empresa_id == empresa_id)
    if setor_id is not None:
        q = q.filter(Ticket.setor_id == setor_id)
    if status_id is not None:
        q = q.filter(Ticket.status_id == status_id)
    if protocolo:
        q = q.filter(Ticket.protocolo.ilike(f"%{protocolo}%"))
    q = q.order_by(Ticket.created_at.desc())
    return [_ticket_para_read(t) for t in q.all()]


@router.post("", response_model=TicketRead, status_code=201)
def criar(
    data: TicketCreate,
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(obter_atendente_atual),
):
    # Atendente só pode abrir ticket em setor que ele atende
    if atendente.role != "admin":
        setor_ids = [s.id for s in atendente.setores]
        if data.setor_id not in setor_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para este setor")
    empresa = db.query(Empresa).filter(Empresa.id == data.empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada")
    setor = db.query(Setor).filter(Setor.id == data.setor_id).first()
    if not setor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setor não encontrado")
    # Status inicial: primeiro status ativo (ex: "aberto")
    status_inicial = db.query(StatusTicket).filter(StatusTicket.ativo.is_(True)).order_by(StatusTicket.ordem).first()
    if not status_inicial:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cadastre ao menos um status de ticket")
    protocolo = _gerar_protocolo(db)
    ticket = Ticket(
        protocolo=protocolo,
        empresa_id=data.empresa_id,
        setor_id=data.setor_id,
        status_id=status_inicial.id,
        assunto=data.assunto,
        descricao=data.descricao,
        aberto_por_id=data.aberto_por_id,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return _ticket_para_read(ticket)


@router.get("/{ticket_id}", response_model=TicketRead)
def obter(
    ticket_id: int,
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(obter_atendente_atual),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket não encontrado")
    if not _pode_ver_ticket(atendente, ticket):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para este ticket")
    return _ticket_para_read(ticket)


@router.get("/{ticket_id}/historico", response_model=list[TicketHistoricoRead])
def historico(
    ticket_id: int,
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(obter_atendente_atual),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket não encontrado")
    if not _pode_ver_ticket(atendente, ticket):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para este ticket")
    return [
        TicketHistoricoRead(
            id=h.id,
            ticket_id=h.ticket_id,
            atendente_id=h.atendente_id,
            campo=h.campo,
            valor_antigo=h.valor_antigo,
            valor_novo=h.valor_novo,
            created_at=h.created_at,
        )
        for h in ticket.historicos
    ]


def _registrar_historico(db: Session, ticket_id: int, atendente_id: int | None, campo: str, valor_antigo: str | None, valor_novo: str | None):
    db.add(TicketHistorico(
        ticket_id=ticket_id,
        atendente_id=atendente_id,
        campo=campo,
        valor_antigo=valor_antigo,
        valor_novo=valor_novo,
    ))


@router.patch("/{ticket_id}", response_model=TicketRead)
def atualizar(
    ticket_id: int,
    data: TicketUpdate,
    db: Session = Depends(get_db),
    atendente: Atendente = Depends(obter_atendente_atual),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket não encontrado")
    if not _pode_ver_ticket(atendente, ticket):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para este ticket")
    update = data.model_dump(exclude_unset=True)
    if "status_id" in update:
        antigo = str(ticket.status_id)
        novo = str(update["status_id"])
        _registrar_historico(db, ticket.id, atendente.id, "status_id", antigo, novo)
    if "atendente_id" in update:
        antigo = str(ticket.atendente_id) if ticket.atendente_id else ""
        novo = str(update["atendente_id"]) if update["atendente_id"] else ""
        _registrar_historico(db, ticket.id, atendente.id, "atendente_id", antigo, novo)
    if "setor_id" in update:
        antigo = str(ticket.setor_id)
        novo = str(update["setor_id"])
        _registrar_historico(db, ticket.id, atendente.id, "setor_id", antigo, novo)
    for k, v in update.items():
        setattr(ticket, k, v)
    db.commit()
    db.refresh(ticket)
    return _ticket_para_read(ticket)
