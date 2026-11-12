"""Preferências do planejamento (persistidas na tabela settings)."""
from __future__ import annotations

import copy
import json
import sqlite3
from typing import Any

DEFAULTS: dict[str, Any] = {
    "start_date": "2026-11-13",
    "rest_weekday": 6,          # 0=segunda … 6=domingo
    # minutos de estudo (aulas + revisão) por dia da semana (segunda=0)
    "capacity": {"0": 135, "1": 135, "2": 120, "3": 135, "4": 105, "5": 210, "6": 0},
    # multiplicador de capacidade em datas especiais (0 = descanso)
    "holidays": {"2026-12-24": 0.5, "2026-12-25": 0, "2026-12-31": 0.5, "2027-01-01": 0},
    "review": {
        "intervals": [1, 7, 30],
        "pct": {"1": 0.07, "7": 0.05, "30": 0.04},
        "min": 3,
        "max": {"1": 8, "7": 6, "30": 5},
        "daily_cap": 25,
        "grace": {"1": 2, "7": 5, "30": 10},
    },
    "competency_baselines": {},  # {competência: 0..1} — ponto de partida editável (estimativa, não fato)
    "focus_minutes": 25,
}


def _merge(base: dict, override: dict) -> dict:
    out = copy.deepcopy(base)
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict) and k not in ("holidays",):
            out[k] = _merge(out[k], v)
        else:
            out[k] = v
    return out


def load(conn: sqlite3.Connection) -> dict[str, Any]:
    stored = {r[0]: json.loads(r[1]) for r in conn.execute("SELECT key, value FROM settings")}
    return _merge(DEFAULTS, stored)


def save(conn: sqlite3.Connection, values: dict[str, Any]) -> dict[str, Any]:
    for k, v in values.items():
        if k not in DEFAULTS:
            raise ValueError(f"Configuração desconhecida: {k}")
        conn.execute(
            "INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (k, json.dumps(v)),
        )
    return load(conn)
