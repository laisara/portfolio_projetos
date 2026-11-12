"""Inicia o servidor local e abre o navegador (somente este PC: 127.0.0.1).

    python scripts/run.py
    python scripts/run.py --port 8010
"""
from __future__ import annotations

import argparse
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()

    import uvicorn

    url = f"http://localhost:{args.port}"
    print("\n  AI Engineer Study Tracker")
    print(f"  Acesse: {url}  (somente neste PC)")
    print("  Para encerrar: Ctrl+C\n")
    if not args.no_browser:
        threading.Thread(target=lambda: (time.sleep(1.5), webbrowser.open(url)), daemon=True).start()
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=args.port, log_level="warning", app_dir=str(ROOT))


if __name__ == "__main__":
    main()
