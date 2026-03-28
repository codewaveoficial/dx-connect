from pydantic import BaseModel, EmailStr
from datetime import datetime


class AtendenteBase(BaseModel):
    email: EmailStr
    nome: str
    role: str = "atendente"  # admin | atendente
    ativo: bool = True


class AtendenteCreate(AtendenteBase):
    senha: str
    setor_ids: list[int] = []  # atendente: pelo menos um setor; admin: pode vazio


class AtendenteUpdate(BaseModel):
    email: str | None = None
    nome: str | None = None
    senha: str | None = None
    role: str | None = None
    ativo: bool | None = None
    setor_ids: list[int] | None = None


class AtendenteRead(AtendenteBase):
    """Resposta da API: e-mail vem do banco; não usar EmailStr (legado .test / TLD reservado quebra a listagem)."""

    id: int
    email: str  # type: ignore[assignment]
    created_at: datetime | None = None
    updated_at: datetime | None = None
    setor_ids: list[int] = []

    class Config:
        from_attributes = True


class AtendenteLogin(BaseModel):
    """Corpo do login: aceita qualquer string para não bloquear contas legadas no banco."""

    email: str
    senha: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
