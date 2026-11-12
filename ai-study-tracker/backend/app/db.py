"""Acesso ao SQLite (local-first). Uma conexão por requisição."""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from . import config

SCHEMA = (Path(__file__).parent / "schema.sql").read_text(encoding="utf-8")
SCHEMA_VERSION = "4"


def connect(path: Path | None = None) -> sqlite3.Connection:
    path = path or config.db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


@contextmanager
def session_scope() -> Iterator[sqlite3.Connection]:
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_conn() -> Iterator[sqlite3.Connection]:
    """Dependência FastAPI."""
    with session_scope() as conn:
        yield conn


def init_schema(conn: sqlite3.Connection) -> None:
    # Migração: catálogo v3 (trilhas reais, aulas com duração, sem Lab). Tabelas de catálogo e do Lab
    # antigas são recriadas; sessões, revisões e conquistas (tabelas do usuário) são preservadas.
    track_cols = {r[1] for r in conn.execute("PRAGMA table_info(tracks)")}
    lesson_cols = {r[1] for r in conn.execute("PRAGMA table_info(lessons)")}
    content_cols = {r[1] for r in conn.execute("PRAGMA table_info(contents)")}
    if (track_cols and "group_name" not in track_cols) or (lesson_cols and "has_duration" not in lesson_cols) or (content_cols and "optional" not in content_cols):
        for t in ("appearances", "track_slots", "lessons", "modules", "contents", "tracks"):
            conn.execute(f"DROP TABLE IF EXISTS {t}")
        conn.execute("DELETE FROM meta WHERE key IN ('catalog_meta','catalog_customized')")
    for t in ("lab_tasks", "lab_milestones", "lab_stages"):
        conn.execute(f"DROP TABLE IF EXISTS {t}")
    conn.executescript(SCHEMA)
    conn.execute("INSERT OR IGNORE INTO meta(key, value) VALUES ('schema_version', ?)", (SCHEMA_VERSION,))


def rows(conn: sqlite3.Connection, sql: str, params: tuple | dict = ()) -> list[dict[str, Any]]:
    return [dict(r) for r in conn.execute(sql, params).fetchall()]


def row(conn: sqlite3.Connection, sql: str, params: tuple | dict = ()) -> dict[str, Any] | None:
    r = conn.execute(sql, params).fetchone()
    return dict(r) if r else None


def get_meta(conn: sqlite3.Connection, key: str, default: str | None = None) -> str | None:
    r = conn.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
    return r[0] if r else default


def set_meta(conn: sqlite3.Connection, key: str, value: str) -> None:
    conn.execute("INSERT INTO meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", (key, value))


def loads(value: str | None, default: Any = None) -> Any:
    if value is None:
        return default
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return default
