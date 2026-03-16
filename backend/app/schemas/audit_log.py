from pydantic import BaseModel
from datetime import datetime


class AuditLogRead(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    action: str
    atendente_id: int | None
    atendente_nome: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
