from pydantic import BaseModel

from app.schemas.ticket import TicketRead


class StatusCount(BaseModel):
    status_id: int
    status_nome: str
    total: int


class DashboardResumo(BaseModel):
    total_tickets: int
    abertos_hoje: int
    por_status: list[StatusCount]


class DashboardResponse(BaseModel):
    resumo: DashboardResumo
    ultimos_tickets: list[TicketRead]
