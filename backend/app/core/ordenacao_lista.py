"""Enums e helpers para ordenação em listagens paginadas."""

from enum import Enum

from sqlalchemy import asc, desc


class OrdemLista(str, Enum):
    asc = "asc"
    desc = "desc"


def expr_ordem(col, ordem: OrdemLista):
    return desc(col) if ordem == OrdemLista.desc else asc(col)
