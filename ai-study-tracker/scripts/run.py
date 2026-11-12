"""Inicia o servidor local e abre o navegador.

    python scripts/run.py                # http://localhost:8000 (só este PC)
    python scripts/run.py --lan          # acessível pelo celular na mesma rede Wi-Fi
    python scripts/run.py --lan --https  # HTTPS com certs/cert.pem + certs/key.pem (PWA no Android)
"""
from __future__ import annotations

import argparse
import socket
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def lan_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "127.0.0.1"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--lan", action="store_true", help="aceita conexões da rede local")
    ap.add_argument("--https", action="store_true", help="usa certs/cert.pem e certs/key.pem")
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()

    import uvicorn

    host = "0.0.0.0" if args.lan else "127.0.0.1"
    scheme = "https" if args.https else "http"
    ssl = {}
    if args.https:
        cert, key = ROOT / "certs" / "cert.pem", ROOT / "certs" / "key.pem"
        if not (cert.exists() and key.exists()):
            sys.exit("Certificados não encontrados em certs/. Veja README → 'Usar no celular'.")
        ssl = {"ssl_certfile": str(cert), "ssl_keyfile": str(key)}

    url = f"{scheme}://localhost:{args.port}"
    print("\n  AI Engineer Study Tracker")
    print(f"  Neste PC:   {url}")
    if args.lan:
        print(f"  No celular: {scheme}://{lan_ip()}:{args.port}  (mesma rede Wi-Fi)")
    print("  Para encerrar: Ctrl+C\n")
    if not args.no_browser:
        threading.Thread(target=lambda: (time.sleep(1.5), webbrowser.open(url)), daemon=True).start()
    uvicorn.run("backend.app.main:app", host=host, port=args.port, log_level="warning", app_dir=str(ROOT), **ssl)


if __name__ == "__main__":
    main()
