"""GET JSON em APIs públicas (IBGE, ViaCEP, etc.)."""

from __future__ import annotations

import gzip
import json
import urllib.request

_USER_AGENT = "DX-Connect/1.0"


def _decode_json_payload(raw: bytes) -> object:
    """UTF-8 JSON ou gzip (alguns servidores ignoram Accept-Encoding: identity)."""
    if len(raw) >= 2 and raw[0:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    return json.loads(raw.decode("utf-8"))


def public_json_get(url: str, timeout: float) -> object:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": _USER_AGENT,
            "Accept": "application/json",
            "Accept-Encoding": "identity",
        },
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    return _decode_json_payload(raw)


def ibge_get_json(url: str, timeout: float) -> object:
    """Compat: chamadas ao servicodados.ibge.gov.br."""
    return public_json_get(url, timeout)
