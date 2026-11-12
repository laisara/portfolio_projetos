"""Backup do banco SQLite (seguro com o app aberto). Mantém os 30 mais recentes."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.app import backup, config  # noqa: E402

if not config.db_path().exists():
    sys.exit(f"Banco não encontrado: {config.db_path()} (rode o app ao menos uma vez).")
dest = backup.backup_to_file()
old = sorted(config.backup_dir().glob("backup-*.db"))[:-30]
for f in old:
    f.unlink()
print(f"Backup criado: {dest}")
