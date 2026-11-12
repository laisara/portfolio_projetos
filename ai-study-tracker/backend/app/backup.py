"""Backup/restore do SQLite e export/import JSON."""
from __future__ import annotations

import json
import shutil
import sqlite3
import tempfile
from datetime import datetime
from pathlib import Path

from . import config, db

USER_TABLES = ["settings", "lesson_progress", "sessions", "review_log", "achievements_unlocked", "day_baseline"]
REQUIRED_TABLES = {"sessions", "lesson_progress", "contents", "lessons"}


def backup_to_file(dest_dir: Path | None = None, label: str = "backup") -> Path:
    dest_dir = dest_dir or config.backup_dir()
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{label}-{datetime.now():%Y%m%d-%H%M%S}.db"
    src = db.connect()
    try:
        out = sqlite3.connect(dest)
        src.backup(out)  # API de backup: seguro com o app em execução
        out.close()
    finally:
        src.close()
    return dest


def validate_db_file(path: Path) -> None:
    with open(path, "rb") as fh:
        if fh.read(16) != b"SQLite format 3\x00":
            raise ValueError("O arquivo não é um banco SQLite válido.")
    conn = sqlite3.connect(path)
    try:
        try:
            if conn.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise ValueError("Banco corrompido (integrity_check falhou).")
            names = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        except sqlite3.DatabaseError as exc:
            raise ValueError(f"Banco corrompido ou ilegível: {exc}") from exc
        missing = REQUIRED_TABLES - names
        if missing:
            raise ValueError(f"Backup incompatível: faltam tabelas {sorted(missing)}.")
    finally:
        conn.close()


def restore_from_bytes(data: bytes) -> Path:
    """Valida, faz backup de segurança do estado atual e restaura."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        tmp.write(data)
        tmp_path = Path(tmp.name)
    try:
        validate_db_file(tmp_path)
        safety = backup_to_file(label="antes-de-restaurar")
        src = sqlite3.connect(tmp_path)
        dst = db.connect()
        try:
            src.backup(dst)
        finally:
            src.close()
            dst.close()
        return safety
    finally:
        tmp_path.unlink(missing_ok=True)


def export_json(conn: sqlite3.Connection) -> dict:
    out = {"app": "ai-study-tracker", "version": config.APP_VERSION, "exported_at": datetime.now().isoformat(timespec="seconds"), "tables": {}}
    for t in USER_TABLES:
        out["tables"][t] = db.rows(conn, f"SELECT * FROM {t}")
    out["catalog_meta"] = json.loads(db.get_meta(conn, "catalog_meta") or "{}")
    return out


def import_json(conn: sqlite3.Connection, data: dict) -> dict:
    if not isinstance(data, dict) or data.get("app") != "ai-study-tracker" or "tables" not in data:
        raise ValueError("Arquivo de exportação inválido.")
    tables = data["tables"]
    counts = {}
    for t in USER_TABLES:
        rows = tables.get(t, [])
        conn.execute(f"DELETE FROM {t}")
        for r in rows:
            cols = list(r.keys())
            conn.execute(f"INSERT INTO {t} ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})", [r[c] for c in cols])
        counts[t] = len(rows)
    return counts


def copy_db_file(dest: Path) -> None:
    shutil.copy2(config.db_path(), dest)
