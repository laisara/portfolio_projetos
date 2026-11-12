import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("AST_DB", str(tmp_path / "test.db"))
    monkeypatch.setenv("AST_BACKUP_DIR", str(tmp_path / "backups"))
    monkeypatch.setenv("AST_TODAY", "2026-11-13")
    from fastapi.testclient import TestClient
    from backend.app.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def set_today(monkeypatch):
    def _set(iso: str):
        monkeypatch.setenv("AST_TODAY", iso)
    return _set
