"""Restaura um backup .db. Feche o app (start.bat) antes.

    python scripts/restore.py database/backups/backup-20261201-2130.db
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.app import backup  # noqa: E402

if len(sys.argv) != 2:
    files = sorted((ROOT / "database" / "backups").glob("*.db"))
    print("Uso: restore.bat <arquivo.db>\nBackups disponíveis:")
    for f in files[-10:]:
        print("  ", f)
    sys.exit(1)
src = Path(sys.argv[1])
if not src.exists():
    sys.exit(f"Arquivo não encontrado: {src}")
safety = backup.restore_from_bytes(src.read_bytes())
print(f"Restaurado de {src}. Backup de segurança do estado anterior: {safety}")
