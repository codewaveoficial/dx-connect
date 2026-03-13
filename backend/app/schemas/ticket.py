from pydantic import BaseModel
from datetime import datetime


class TicketBase(BaseModel):
    empresa_id: int
    setor_id: int
    assunto: str
    descricao: str | None = None
    aberto_por_id: int | None = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    setor_id: int | None = None
    status_id: int | None = None
    atendente_id: int | None = None
    assunto: str | None = None
    descricao: str | None = None


class TicketRead(BaseModel):
    id: int
    protocolo: str
    empresa_id: int
    setor_id: int
    status_id: int
    atendente_id: int | None = None
    aberto_por_id: int | None = None
    assunto: str
    descricao: str | None = None
    fechado_em: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    # opcional: nomes para exibição
    empresa_nome: str | None = None
    setor_nome: str | None = None
    status_nome: str | None = None
    atendente_nome: str | None = None

    class Config:
        from_attributes = True


class TicketHistoricoRead(BaseModel):
    id: int
    ticket_id: int
    atendente_id: int | None = None
    campo: str
    valor_antigo: str | None = None
    valor_novo: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
