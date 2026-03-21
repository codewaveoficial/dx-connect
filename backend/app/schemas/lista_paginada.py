"""Resposta padrão para listagens com busca e paginação."""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ListaPaginada(BaseModel, Generic[T]):
    items: list[T]
    total: int
