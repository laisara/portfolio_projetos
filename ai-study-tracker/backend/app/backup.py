"""Backup/restore do SQLite e export/import JSON."""
from __future__ import annotations

import json
import re
import shutil
import sqlite3
import tempfile
import time
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
    if not isinstance(tables, dict):
        raise ValueError("Arquivo de exportação inválido.")
    # valida TUDO antes de apagar qualquer coisa: um arquivo ruim não pode destruir os dados atuais
    valid_cols = {t: {r[1] for r in conn.execute(f"PRAGMA table_info({t})")} for t in USER_TABLES}
    for t in USER_TABLES:
        rows = tables.get(t, [])
        if not isinstance(rows, list):
            raise ValueError(f"Tabela '{t}' inválida no arquivo.")
        for r in rows:
            if not isinstance(r, dict) or not r or not set(r) <= valid_cols[t]:
                raise ValueError(f"Linha inválida na tabela '{t}': colunas desconhecidas.")
    counts = {}
    conn.execute("SAVEPOINT import_json")
    try:
        for t in USER_TABLES:
            rows = tables.get(t, [])
            conn.execute(f"DELETE FROM {t}")
            for r in rows:
                cols = list(r.keys())
                conn.execute(f"INSERT INTO {t} ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})", [r[c] for c in cols])
            counts[t] = len(rows)
    except sqlite3.Error as exc:
        conn.execute("ROLLBACK TO import_json")
        raise ValueError(f"Não foi possível importar (nada foi alterado): {exc}") from exc
    conn.execute("RELEASE import_json")
    return counts


def copy_db_file(dest: Path) -> None:
    shutil.copy2(config.db_path(), dest)


# ------------------------------------------------------------- backup automático
AUTO_KEEP = 30  # só os backups "auto-*" são podados; manuais e "antes-de-*" nunca são apagados


def list_backups() -> list[dict]:
    d = config.backup_dir()
    if not d.exists():
        return []
    files = sorted(d.glob("*.db"), key=lambda f: f.stat().st_mtime, reverse=True)
    return [{"name": f.name, "size": f.stat().st_size,
             "at": datetime.fromtimestamp(f.stat().st_mtime).isoformat(timespec="seconds"),
             "kind": re.sub(r"-\d{8}-\d{6}\.db$", "", f.name)} for f in files]


def auto_backup(label: str = "auto", min_hours: float = 12) -> Path | None:
    """Cria um backup se o último do mesmo tipo for mais antigo que `min_hours`. Nunca sobrescreve:
    cada arquivo tem data e hora no nome. Retorna None se não era necessário (ou se não há banco)."""
    if not config.db_path().exists():
        return None
    d = config.backup_dir()
    recent = [f for f in d.glob(f"{label}-*.db") if time.time() - f.stat().st_mtime < min_hours * 3600] if d.exists() else []
    if recent:
        return None
    dest = backup_to_file(label=label)
    for old in sorted(d.glob(f"{label}-*.db"))[:-AUTO_KEEP]:
        old.unlink(missing_ok=True)
    return dest
