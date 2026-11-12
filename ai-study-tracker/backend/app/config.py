"""Configuração central. Tudo é lido em tempo de chamada para facilitar testes."""
from __future__ import annotations

import os
from datetime import date
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = BASE_DIR / "frontend"
DATA_DIR = BASE_DIR / "data"
APP_VERSION = "1.0.0"


def db_path() -> Path:
    return Path(os.environ.get("AST_DB", BASE_DIR / "database" / "study_tracker.db"))


def backup_dir() -> Path:
    return Path(os.environ.get("AST_BACKUP_DIR", BASE_DIR / "database" / "backups"))


def catalog_path() -> Path:
    return Path(os.environ.get("AST_CATALOG", DATA_DIR / "catalog.json"))


def lab_path() -> Path:
    return Path(os.environ.get("AST_LAB", DATA_DIR / "lab.json"))


def today() -> date:
    """Data de hoje. AST_TODAY=YYYY-MM-DD permite simular datas (demo/testes)."""
    forced = os.environ.get("AST_TODAY")
    return date.fromisoformat(forced) if forced else date.today()
