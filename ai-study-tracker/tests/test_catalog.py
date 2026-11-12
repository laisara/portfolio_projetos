import json
import sqlite3
from pathlib import Path

import pytest
from pydantic import ValidationError

from backend.app import catalog, db

ROOT = Path(__file__).resolve().parents[1]


def mem():
    c = sqlite3.connect(":memory:")
    c.row_factory = sqlite3.Row
    db.init_schema(c)
    return c


def load_real():
    conn = mem()
    data = json.loads((ROOT / "data" / "catalog.json").read_text(encoding="utf-8"))
    return conn, data, catalog.import_catalog(conn, data)


def test_parse_duration():
    assert catalog.parse_duration("1:32:00") == 92
    assert catalog.parse_duration("26:30") == 26.5
    assert catalog.parse_duration(47) == 47
    assert catalog.parse_duration(None) is None and catalog.parse_duration("-") is None
    with pytest.raises(ValueError):
        catalog.parse_duration("1h32")


def test_official_numbers():
    _, _, a = load_real()
    assert a["tracks"] == 8 and a["courses"] == 42 and a["appearances"] == 48 and a["lessons"] == 463
    assert a["lessons_without_duration"] == 56 and a["placeholders"] == 1
    assert round(a["unique_min"] * 60) == 66 * 3600 + 21 * 60 + 37      # 66h21m37s = soma das aulas
    assert round(a["gross_min"] * 60) == 74 * 3600 + 30 * 60 + 39       # soma das 8 trilhas
    assert round(a["duplicate_min"] * 60) == round((a["gross_min"] - a["unique_min"]) * 60)
    assert a["declared_min"] == 62 * 60 + 34 and a["diff_vs_declared_min"] > 0


def test_every_course_sum_matches_card_within_two_minutes():
    conn, data, _ = load_real()
    for c in db.rows(conn, "SELECT id, duration_min, card_min FROM contents"):
        assert abs(c["duration_min"] - c["card_min"]) <= 2, c


def test_track_sums_match_headers():
    _, _, a = load_real()
    for t in a["tracks_check"]:
        assert abs(t["sum_min"] - t["header_min"]) <= 30, t   # T8: cards somam 24 min a mais que o cabeçalho


def test_confirmed_tracks_and_groups():
    conn, data, _ = load_real()
    ts = db.rows(conn, "SELECT * FROM tracks ORDER BY ord")
    assert [t["title"] for t in ts] == ["Dominando o ecossistema Claude", "Dominando Openclaw", "Criando Agentes Pessoais com Hermes Agent",
                                        "Agentes com GPT", "Aplicações Inteligentes com IA", "Ferramentas de AI para Desenvolvedores",
                                        "Criando agentes de atendimento no N8N", "Aplicações AI com Python"]
    assert {t["group_name"] for t in ts[:4]} == {"Produtividade pessoal com IA"}
    assert {t["group_name"] for t in ts[4:]} == {"Criando sistemas profissionais de inteligência artificial"}
    counts = [conn.execute("SELECT COUNT(*) FROM appearances WHERE track_id=?", (t["id"],)).fetchone()[0] for t in ts]
    assert counts == [5, 4, 3, 3, 7, 6, 8, 12]


def test_repeated_courses_single_record_multiple_tracks():
    conn, _, a = load_real()
    dup = {d["content_id"]: d for d in a["duplicates"]}
    assert set(dup) == {"GENAI-001", "CODE-001"}
    assert dup["GENAI-001"]["appearances"] == 6 and dup["CODE-001"]["appearances"] == 2
    assert conn.execute("SELECT COUNT(*) FROM contents WHERE id='GENAI-001'").fetchone()[0] == 1
    assert conn.execute("SELECT COUNT(*) FROM lessons WHERE content_id='GENAI-001'").fetchone()[0] == 9
    assert conn.execute("SELECT COUNT(*) FROM lessons WHERE content_id='CODE-001'").fetchone()[0] == 1


def test_lessons_have_titles_and_real_durations():
    conn, _, _ = load_real()
    row = conn.execute("SELECT * FROM lessons WHERE id='GENAI-001.L02'").fetchone()
    assert row["title"] == "Um pouco de história" and round(row["duration_min"] * 60) == 20 * 60 + 32
    assert not conn.execute("SELECT 1 FROM lessons WHERE title LIKE '%parte%/%'").fetchall()
    q = conn.execute("SELECT * FROM lessons WHERE id='PY-001.L04'").fetchone()
    assert q["has_duration"] == 0 and q["kind"] == "quiz" and q["duration_min"] == 0


def test_untitled_modules_are_numbered():
    conn, _, _ = load_real()
    assert [m["title"] for m in db.rows(conn, "SELECT title FROM modules WHERE content_id='HERMES-001'")] == ["Módulo 1"]
    assert [m["title"] for m in db.rows(conn, "SELECT title FROM modules WHERE content_id='LANG-001' ORDER BY ord")] == ["Módulo 1", "Módulo 2"]


def test_excluded_electives_are_not_in_catalog():
    conn, data, _ = load_real()
    titles = " ".join(c["title"] for c in data["contents"].values()).lower()
    assert "git e github" not in titles and "professores" not in titles and "aprofundar" not in titles
    assert len(data["meta"]["excluded"]) == 3


def test_placeholder_is_not_a_lesson_to_finish():
    conn, _, _ = load_real()
    ph = conn.execute("SELECT * FROM lessons WHERE kind='placeholder'").fetchall()
    assert len(ph) == 1 and ph[0]["content_id"] == "CODE-002"


def test_study_sequence_follows_platform_order_once():
    conn, _, _ = load_real()
    order = [r["id"] for r in db.rows(conn, "SELECT id FROM contents ORDER BY study_ord")]
    assert len(order) == len(set(order)) == 42
    assert order[:3] == ["START-CLAUDE", "GENAI-001", "CLAUDE-001"]


def test_progress_preserved_on_reimport_and_orphans_dropped():
    conn, data, _ = load_real()
    conn.execute("INSERT INTO lesson_progress(lesson_id, completed_on) VALUES ('GENAI-001.L01','2026-11-13'), ('GONE.L01','2026-11-13')")
    catalog.import_catalog(conn, data)
    ids = [r[0] for r in conn.execute("SELECT lesson_id FROM lesson_progress")]
    assert ids == ["GENAI-001.L01"]


@pytest.mark.parametrize("bad", [
    {"tracks": [], "contents": {"A-001": {"title": "x", "modules": [{"lessons": [{"title": "a", "duration": "1:00"}]}]}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t", "courses": ["A-001"]}], "contents": {"a-1": {"title": "x", "modules": [{"lessons": [{"title": "a", "duration": "1:00"}]}]}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t", "courses": ["NOPE-001"]}], "contents": {"A-001": {"title": "x", "modules": [{"lessons": [{"title": "a", "duration": "1:00"}]}]}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t", "courses": ["A-001", "A-001"]}], "contents": {"A-001": {"title": "x", "modules": [{"lessons": [{"title": "a", "duration": "1:00"}]}]}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t", "courses": ["A-001"]}], "contents": {"A-001": {"title": "x", "modules": [{"lessons": [{"title": "a", "duration": "xx"}]}]}, "B-001": {"title": "y", "modules": [{"lessons": [{"title": "a"}]}]}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t", "courses": ["A-001"]}], "contents": {"A-001": {"title": "x", "type": "oficina", "modules": [{"lessons": [{"title": "a"}]}]}}},
])
def test_invalid_catalogs_rejected(bad):
    with pytest.raises(ValidationError):
        catalog.import_catalog(mem(), bad)


def test_minimal_valid_catalog_with_repeated_course_in_two_tracks():
    conn = mem()
    data = {"tracks": [{"id": "T1", "order": 1, "title": "A", "courses": ["X-001"]}, {"id": "T2", "order": 2, "title": "B", "courses": ["X-001", "Y-001"]}],
            "contents": {"X-001": {"title": "x", "modules": [{"lessons": [{"title": "a", "duration": "10:00"}, {"title": "Quiz", "kind": "quiz"}]}]},
                         "Y-001": {"title": "y", "modules": [{"lessons": [{"title": "b", "duration": "5:00"}]}]}}}
    a = catalog.import_catalog(conn, data)
    assert a["unique_min"] == 15 and a["gross_min"] == 25 and a["duplicate_min"] == 10 and a["lessons_without_duration"] == 1
