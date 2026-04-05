"""Sincronização de municípios (IBGE) para o banco local."""

from __future__ import annotations

import logging
import urllib.error
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.config import settings
from app.models.app_cache_meta import AppCacheMeta
from app.models.ibge_municipio import IbgeMunicipio
from app.services.ibge_client import ibge_get_json

logger = logging.getLogger(__name__)

_TIMEOUT_SYNC_S = 60
_TIMEOUT_SINGLE_UF_S = 20

CHAVE_META = "ibge_municipios"


def municipios_nomes_uf_direto_ibge(sigla_uf: str) -> list[str]:
    """Busca apenas uma UF no IBGE (fallback quando o cache ainda está vazio)."""
    sigla = sigla_uf.strip().upper()
    try:
        estados = ibge_get_json(
            "https://servicodados.ibge.gov.br/api/v1/localidades/estados",
            _TIMEOUT_SINGLE_UF_S,
        )
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as e:
        logger.warning("IBGE estados (fallback UF=%s): %s", sigla, e)
        raise
    if not isinstance(estados, list):
        return []
    st = next(
        (e for e in estados if isinstance(e, dict) and str(e.get("sigla", "")).upper() == sigla),
        None,
    )
    if not st or st.get("id") is None:
        return []
    try:
        eid = int(st["id"])
    except (TypeError, ValueError):
        return []
    try:
        munis = ibge_get_json(
            f"https://servicodados.ibge.gov.br/api/v1/localidades/estados/{eid}/municipios?orderBy=nome",
            _TIMEOUT_SINGLE_UF_S,
        )
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as e:
        logger.warning("IBGE municípios (fallback UF=%s): %s", sigla, e)
        raise
    if not isinstance(munis, list):
        return []
    nomes: list[str] = []
    for m in munis:
        if isinstance(m, dict) and m.get("nome"):
            nomes.append(str(m["nome"]))
    return nomes


def sync_ibge_municipios_full(db: Session) -> int:
    """Apaga o cache e recarrega todos os municípios. Retorna quantidade inserida."""
    try:
        estados = ibge_get_json(
            "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
            _TIMEOUT_SYNC_S,
        )
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as e:
        logger.exception("IBGE sync — lista de estados: %s", e)
        raise

    if not isinstance(estados, list):
        raise RuntimeError("Resposta inválida do IBGE (estados).")

    db.execute(delete(IbgeMunicipio))
    total = 0
    now = datetime.now(timezone.utc)

    for st in estados:
        if not isinstance(st, dict):
            continue
        sigla = st.get("sigla")
        rid = st.get("id")
        if not sigla or rid is None:
            continue
        try:
            eid = int(rid)
        except (TypeError, ValueError):
            continue
        sigla_u = str(sigla).upper()[:2]
        try:
            munis = ibge_get_json(
                f"https://servicodados.ibge.gov.br/api/v1/localidades/estados/{eid}/municipios?orderBy=nome",
                _TIMEOUT_SYNC_S,
            )
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as e:
            logger.warning("IBGE sync — municípios UF=%s: %s", sigla_u, e)
            continue
        if not isinstance(munis, list):
            continue
        batch: list[IbgeMunicipio] = []
        for m in munis:
            if not isinstance(m, dict) or m.get("id") is None or not m.get("nome"):
                continue
            try:
                mid = int(m["id"])
            except (TypeError, ValueError):
                continue
            batch.append(IbgeMunicipio(codigo_ibge=mid, uf_sigla=sigla_u, nome=str(m["nome"])[:255]))
        if batch:
            db.bulk_save_objects(batch)
            total += len(batch)

    meta = db.get(AppCacheMeta, CHAVE_META)
    if meta is None:
        meta = AppCacheMeta(chave=CHAVE_META, atualizado_em=now)
        db.add(meta)
    else:
        meta.atualizado_em = now

    logger.info("Sincronização IBGE municípios concluída: %s registros.", total)
    return total


def sync_ibge_municipios_if_stale(db: Session, *, force: bool = False) -> bool:
    """
    Sincroniza o cache completo se não existir metadados ou se estiver acima da idade máxima.
    Retorna True se executou sincronização.
    """
    if force:
        sync_ibge_municipios_full(db)
        return True

    n = db.query(IbgeMunicipio).count()
    meta = db.get(AppCacheMeta, CHAVE_META)

    if n == 0:
        logger.info("Cache de municípios vazio — sincronizando com o IBGE…")
        sync_ibge_municipios_full(db)
        return True

    if meta is None:
        db.add(AppCacheMeta(chave=CHAVE_META, atualizado_em=datetime.now(timezone.utc)))
        return False

    max_age = timedelta(hours=settings.IBGE_MUNICIPIOS_MAX_AGE_HOURS)
    if meta.atualizado_em is None:
        logger.info("Metadados de municípios sem data — sincronizando com o IBGE…")
        sync_ibge_municipios_full(db)
        return True

    au = meta.atualizado_em
    if au.tzinfo is None:
        au = au.replace(tzinfo=timezone.utc)
    else:
        au = au.astimezone(timezone.utc)
    if datetime.now(timezone.utc) - au > max_age:
        logger.info("Cache de municípios desatualizado — sincronizando com o IBGE…")
        sync_ibge_municipios_full(db)
        return True

    return False
