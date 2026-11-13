"""Restaura um backup .db (valida o arquivo e guarda um backup de segurança do estado atual antes de substituir).

    python scripts/restore.py                       # lista os backups e pergunta qual
    python scripts/restore.py database/backups/auto-20261201-213000.db
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.app import backup, config  # noqa: E402


def server_running(port: int = 8000) -> bool:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=1.5) as r:
            return json.load(r).get("app") == "ai-study-tracker"
    except Exception:
        return False


def main() -> None:
    if server_running():
        sys.exit('O tracker esta aberto. Feche-o primeiro ("Fechar AI Engineer Study Tracker.exe" ou stop.bat) e rode de novo.')
    if len(sys.argv) > 2:
        sys.exit("Uso: restore.bat [arquivo.db]")
    if len(sys.argv) == 2:
        src = Path(sys.argv[1])
    else:
        files = sorted(config.backup_dir().glob("*.db"), key=lambda f: f.stat().st_mtime, reverse=True)[:15]
        if not files:
            sys.exit("Nenhum backup encontrado em database/backups.")
        print("Backups disponiveis (mais recentes primeiro):")
        for i, f in enumerate(files, 1):
            print(f"  {i:2}. {f.name}   ({f.stat().st_size // 1024} KB)")
        choice = input("\nNumero do backup a restaurar (Enter cancela): ").strip()
        if not choice.isdigit() or not 1 <= int(choice) <= len(files):
            sys.exit("Cancelado. Nada foi alterado.")
        src = files[int(choice) - 1]
    if not src.exists():
        sys.exit(f"Arquivo nao encontrado: {src}")
    try:
        safety = backup.restore_from_bytes(src.read_bytes())
    except ValueError as exc:
        sys.exit(f"Backup invalido, nada foi alterado: {exc}")
    print(f"Restaurado de {src.name}.\nBackup de seguranca do estado anterior: {safety.name}")


if __name__ == "__main__":
    main()
