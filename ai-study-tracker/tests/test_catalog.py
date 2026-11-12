import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from backend.app import catalog, db

ROOT = Path(__file__).resolve().parents[1]


def mem():
    conn = db.connect(Path(":memory:")) if False else None
    import sqlite3
    c = sqlite3.connect(":memory:")
    c.row_factory = sqlite3.Row
    db.init_schema(c)
    return c


def test_parse_duration():
    assert catalog.parse_duration("1:32:00") == 92
    assert catalog.parse_duration("26:30") == 26.5
    assert catalog.parse_duration(47) == 47
    assert catalog.parse_duration(None) is None
    with pytest.raises(ValueError):
        catalog.parse_duration("1h32")


def test_real_catalog_totals_match_prints():
    conn = mem()
    data = json.loads((ROOT / "data" / "catalog.json").read_text(encoding="utf-8"))
    a = catalog.import_catalog(conn, data)
    assert a["tracks"] == 8
    assert a["gross_min"] == 62 * 60 + 34          # 62h34 declarado no print
    assert a["visible_gross_min"] == 1816           # soma dos cards visíveis (inclui repetido)
    assert a["visible_unique_min"] == 1790          # Masterclass Claude Code contada 1x
    assert a["unique_min"] == a["gross_min"] - 26
    dup = {d["content_id"]: d for d in a["duplicates"]}
    assert set(dup) == {"CODE-001"} and set(dup["CODE-001"]["tracks"]) == {"T1", "T6"}


def test_duplicate_counted_once_in_lessons():
    conn = mem()
    data = json.loads((ROOT / "data" / "catalog.json").read_text(encoding="utf-8"))
    catalog.import_catalog(conn, data)
    n = conn.execute("SELECT COUNT(*) FROM lessons WHERE content_id='CODE-001'").fetchone()[0]
    assert n == 1
    total = conn.execute("SELECT SUM(duration_min) FROM lessons").fetchone()[0]
    assert round(total) == 62 * 60 + 34 - 26


def test_import_with_real_lessons_and_progress_preserved():
    conn = mem()
    data = {"meta": {}, "tracks": [{"id": "T1", "order": 1, "title": "Trilha", "slots": [{"position": 1, "content": "AGENT-001"}]}],
            "contents": {"AGENT-001": {"title": "Agentes", "nature": "agentes", "modules": [
                {"title": "Intro", "lessons": [{"id": "AGENT-001.M1.L01", "title": "O que é um agente", "duration": "12:30"},
                                               {"title": "Loop", "duration": "08:00"}]}]}}}
    catalog.import_catalog(conn, data)
    conn.execute("INSERT INTO lesson_progress(lesson_id, completed_on) VALUES ('AGENT-001.M1.L01', '2026-11-13')")
    catalog.import_catalog(conn, data)  # reimport
    assert conn.execute("SELECT completed_on FROM lesson_progress").fetchone()[0] == "2026-11-13"
    assert conn.execute("SELECT duration_min FROM contents").fetchone()[0] == 20.5


@pytest.mark.parametrize("bad", [
    {"tracks": [], "contents": {"A-001": {"title": "x", "duration": 10}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t", "slots": [{"position": 1, "content": "NOPE-001"}]}], "contents": {"A-001": {"title": "x", "duration": 10}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t", "slots": [{"position": 1, "content": "a-1"}]}], "contents": {"a-1": {"title": "x", "duration": 10}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t", "slots": [{"position": 1, "content": "A-001"}]}], "contents": {"A-001": {"title": "x"}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t", "slots": [{"position": 1, "content": "A-001"}]}], "contents": {"A-001": {"title": "x", "duration": 5, "nature": "magia"}}},
])
def test_invalid_catalogs_rejected(bad):
    with pytest.raises(ValidationError):
        catalog.import_catalog(mem(), bad)
