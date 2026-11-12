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


def load_real():
    conn = mem()
    data = json.loads((ROOT / "data" / "catalog.json").read_text(encoding="utf-8"))
    return conn, data, catalog.import_catalog(conn, data)


def test_four_numbers_audit_matches_prints():
    _, _, a = load_real()
    assert a["declared_min"] == 62 * 60 + 34          # cabeçalho do print
    assert a["identified_gross_min"] == 1816          # 18 aparições (30h16)
    assert a["duplicate_min"] == 26                   # Masterclass Claude Code repetido
    assert a["identified_unique_min"] == 1790         # 17 cursos únicos (29h50)
    assert a["unidentified_min"] == 62 * 60 + 34 - 1816
    assert a["courses"] == 17 and a["appearances"] == 18
    assert a["declared_min"] - a["identified_gross_min"] == a["unidentified_min"]


def test_duplicate_course_counted_once():
    conn, _, a = load_real()
    d = a["duplicates"]
    assert [x["content_id"] for x in d] == ["CODE-001"] and d[0]["appearances"] == 2 and d[0]["positions"] == [4, 5]
    assert conn.execute("SELECT COUNT(*) FROM contents WHERE id='CODE-001'").fetchone()[0] == 1
    assert conn.execute("SELECT COUNT(*) FROM lessons WHERE content_id='CODE-001'").fetchone()[0] == 1


def test_no_reserve_and_no_synthetic_lessons():
    conn, data, _ = load_real()
    ids = set(data["contents"])
    assert not any("RESERVA" in i for i in ids)
    titles = [r[0] for r in conn.execute("SELECT title FROM lessons")]
    assert not any("parte" in t.lower() for t in titles)
    # exatamente 1 unidade por curso, com a duração real do print
    rows = conn.execute("SELECT content_id, COUNT(*) n, SUM(duration_min) d, MAX(segment) cl FROM lessons GROUP BY content_id").fetchall()
    assert len(rows) == 17 and all(r["n"] == 1 and r["cl"] == 1 for r in rows)
    assert round(sum(r["d"] for r in rows)) == 1790
    assert conn.execute("SELECT duration_min FROM contents WHERE id='GENAI-001'").fetchone()[0] == 92
    assert not any("modules" in c for c in data["contents"].values())


def test_tracks_not_invented():
    conn, data, a = load_real()
    assert a["tracks_total"] == 8 and a["tracks_confirmed"] == 0
    assert all(t["name"] is None and t["confirmed"] is False for t in data["tracks"])
    assert conn.execute("SELECT COUNT(*) FROM appearances WHERE track_id IS NOT NULL").fetchone()[0] == 0
    assert a["courses_without_confirmed_track"] == 17


def test_confidence_labels_confirmed_inferred_unknown():
    _, data, _ = load_real()
    for cid, c in data["contents"].items():
        conf = c["confidence"]
        assert conf["title"] == "CONFIRMADO" and conf["duration"] == "CONFIRMADO"
        assert conf["track"] == "A VERIFICAR"
        assert conf["lessons"] == "NÃO IDENTIFICADO"
        assert conf["practice_ratio"] == "ESTIMATIVA DO SISTEMA"
        assert all(a["track"] is None for a in c["appearances"])
    assert data["meta"]["study_sequence_confidence"].startswith("SUGESTÃO")
    assert data["contents"]["IDE-001"]["lesson_count"] == 17   # único dado de nº de aulas nos prints


def test_confirmed_track_assignment_takes_effect():
    conn, data, _ = load_real()
    data["tracks"][0].update(name="Fundamentos", confirmed=True)
    data["contents"]["GENAI-001"]["appearances"][0]["track"] = "T1"
    data["contents"]["CODE-001"]["appearances"][0]["track"] = "T1"
    data["contents"]["CODE-001"]["appearances"][1]["track"] = "T6"
    a = catalog.import_catalog(conn, data)
    assert a["tracks_confirmed"] == 1 and a["courses_without_confirmed_track"] == 15
    assert {x for x in a["duplicates"][0]["tracks"]} == {"T1", "T6"} and a["identified_unique_min"] == 1790


def test_unknown_track_reference_rejected():
    _, data, _ = load_real()
    data["contents"]["GENAI-001"]["appearances"][0]["track"] = "T99"
    with pytest.raises(ValidationError):
        catalog.import_catalog(mem(), data)


def test_lesson_without_duration_rejected_not_invented():
    bad = {"tracks": [{"id": "T1", "order": 1, "title": "t"}],
           "contents": {"A-001": {"title": "x", "modules": [{"title": "m", "lessons": [{"title": "sem duração"}]}]}}}
    with pytest.raises(ValidationError):
        catalog.import_catalog(mem(), bad)


def test_reserve_nature_rejected():
    bad = {"tracks": [{"id": "T1", "order": 1, "title": "t"}], "contents": {"A-001": {"title": "x", "duration": 10, "nature": "reserva"}}}
    with pytest.raises(ValidationError):
        catalog.import_catalog(mem(), bad)


def test_import_with_real_lessons_and_progress_preserved():
    conn = mem()
    data = {"meta": {}, "tracks": [{"id": "T1", "order": 1, "title": "Trilha"}],
            "contents": {"AGENT-001": {"title": "Agentes", "nature": "agentes", "appearances": [{"track": "T1", "position": 1}], "modules": [
                {"title": "Intro", "lessons": [{"id": "AGENT-001.M1.L01", "title": "O que é um agente", "duration": "12:30"},
                                               {"title": "Loop", "duration": "08:00"}]}]}}}
    catalog.import_catalog(conn, data)
    conn.execute("INSERT INTO lesson_progress(lesson_id, completed_on) VALUES ('AGENT-001.M1.L01', '2026-11-13')")
    catalog.import_catalog(conn, data)  # reimport
    assert conn.execute("SELECT completed_on FROM lesson_progress").fetchone()[0] == "2026-11-13"
    assert conn.execute("SELECT duration_min FROM contents").fetchone()[0] == 20.5


@pytest.mark.parametrize("bad", [
    {"tracks": [], "contents": {"A-001": {"title": "x", "duration": 10}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t"}], "contents": {"a-1": {"title": "x", "duration": 10}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t"}], "contents": {"A-001": {"title": "x"}}},
    {"tracks": [{"id": "T1", "order": 1, "title": "t"}], "contents": {"A-001": {"title": "x", "duration": 5, "nature": "magia"}}},
])
def test_invalid_catalogs_rejected(bad):
    with pytest.raises(ValidationError):
        catalog.import_catalog(mem(), bad)
