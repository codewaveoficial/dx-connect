from pydantic import BaseModel
from datetime import datetime


class EmpresaBase(BaseModel):
    rede_id: int
    nome: str
    ativo: bool = True


class EmpresaCreate(EmpresaBase):
    pass


class EmpresaUpdate(BaseModel):
    rede_id: int | None = None
    nome: str | None = None
    ativo: bool | None = None


class EmpresaRead(EmpresaBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
