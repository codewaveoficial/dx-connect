from pydantic import BaseModel
from datetime import datetime


class RedeBase(BaseModel):
    nome: str
    ativo: bool = True


class RedeCreate(RedeBase):
    pass


class RedeUpdate(BaseModel):
    nome: str | None = None
    ativo: bool | None = None


class RedeRead(RedeBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
