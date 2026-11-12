from datetime import date

import pytest


def test_bootstrap_dashboard_and_plan(client):
    d = client.get("/api/dashboard").json()
    assert d["overall"] == 0 and d["xp"] == 0 and d["level"]["name"] == "Explorer"
    assert d["today"]["items"], "o primeiro dia (13/11) deve ter estudo planejado"
    s = client.get("/api/plan/summary").json()
    assert s["start"] == "2026-11-13"
    assert "2026-12-15" < s["end"] < "2027-01-15"   # só o conteúdo identificado; sem reserva
    assert s["rest_days"] >= 6
    assert 100 <= s["avg_per_study_day"] <= 160
    assert abs(s["totals"]["video"] - 1790) < 15      # vídeo agendado == conteúdo único identificado


def test_rest_day_has_nothing(client):
    cal = client.get("/api/calendar?start=2026-11-15&end=2026-11-15").json()["days"][0]
    assert cal["rest"] and cal["planned_total"] == 0
    xmas = client.get("/api/calendar?start=2026-12-25&end=2026-12-25").json()["days"][0]
    assert xmas["planned_total"] == 0


def test_session_awards_xp_completes_lesson_and_recalculates(client):
    item = client.get("/api/today").json()["items"][0]
    r = client.post("/api/sessions", json={"date": "2026-11-13", "type": "VIDEO", "target_kind": "lesson", "target_id": item["ref"],
                                           "title": item["title"], "planned_min": item["minutes"], "actual_min": item["minutes"],
                                           "complete_lessons": [item["ref"]], "focus": True})
    assert r.status_code == 201
    body = r.json()
    assert body["xp_gained"] >= round(item["minutes"]) + 15
    assert "Primeiro passo" in body["new_achievements"]
    videos = [i["ref"] for i in client.get("/api/today").json()["items"] if i["kind"] == "video"]
    assert item["ref"] not in videos


def test_practice_beats_video_xp(client):
    base = {"date": "2026-11-13", "title": "x", "actual_min": 30}
    for t in ("VIDEO", "PRACTICE"):  # aquece conquistas de primeira sessão
        client.post("/api/sessions", json={**base, "type": t, "actual_min": 1})
    v = client.post("/api/sessions", json={**base, "type": "VIDEO"}).json()["xp_gained"]
    p = client.post("/api/sessions", json={**base, "type": "PRACTICE"}).json()["xp_gained"]
    j = client.post("/api/sessions", json={**base, "type": "PROJECT"}).json()["xp_gained"]
    assert v < p < j


def test_adaptive_delay_redistributes_without_touching_history(client, set_today):
    end0 = client.get("/api/dashboard").json()["plan_end"]
    set_today("2026-11-14")  # 13/11 sem estudo nenhum
    d = client.get("/api/dashboard").json()
    assert d["plan_end"] >= end0
    cal = client.get("/api/calendar?start=2026-11-13&end=2026-11-13").json()["days"][0]
    assert cal["planned_total"] > 0, "o plano do dia passado continua visível como histórico"


def test_adaptive_ahead_brings_future_earlier(client):
    end0 = client.get("/api/dashboard").json()["plan_end"]
    c = client.get("/api/contents/CLAUDE-001").json()
    ids = [l["id"] for m in c["modules"] for l in m["lessons"]]
    client.post("/api/sessions", json={"date": "2026-11-13", "type": "VIDEO", "title": "maratona", "actual_min": 180, "complete_lessons": ids})
    end1 = client.get("/api/dashboard").json()["plan_end"]
    assert end1 <= end0


def test_validation_errors(client):
    assert client.post("/api/sessions", json={"date": "2026-11-13", "type": "VIDEO", "title": "", "actual_min": 10}).status_code == 422
    assert client.post("/api/sessions", json={"date": "2026-11-13", "type": "BOGUS", "title": "x", "actual_min": 10}).status_code == 422
    assert client.post("/api/sessions", json={"date": "2026-11-13", "type": "VIDEO", "title": "x", "actual_min": 0}).status_code == 400
    assert client.post("/api/sessions", json={"date": "2030-01-01", "type": "VIDEO", "title": "x", "actual_min": 10}).status_code == 400
    assert client.post("/api/sessions", json={"date": "2026-11-13", "type": "VIDEO", "title": "x", "actual_min": 10, "complete_lessons": ["NOPE"]}).status_code == 400
    assert client.put("/api/settings", json={"capacity": {"0": 999}}).status_code == 422
    assert client.post("/api/lessons/NOPE/toggle", json={"completed": True}).status_code == 404


def test_review_flow(client, set_today):
    c = client.get("/api/contents/GENAI-001").json()
    lid = c["modules"][0]["lessons"][0]["id"]
    client.post(f"/api/lessons/{lid}/toggle", json={"completed": True})
    set_today("2026-11-14")
    revs = client.get("/api/reviews").json()["reviews"]
    d1 = next(r for r in revs if r["interval"] == 1)
    assert d1["status"] == "due"
    items = client.get("/api/today").json()["items"]
    assert items[0]["kind"] == "review"
    r = client.post(f"/api/reviews/{d1['key']}/done").json()
    assert r["xp_gained"] >= 15


def test_lab_milestones_complete_stage(client):
    lab = client.get("/api/lab").json()["stages"]
    s = lab[0]
    for m in s["milestones"]:
        client.post(f"/api/lab/milestones/{m['id']}/toggle")
    s2 = client.get("/api/lab").json()["stages"][0]
    assert s2["effective_status"] == "done"
    g = client.get("/api/gamification").json()
    assert g["xp"] >= 2 * 150 + 400


def test_settings_change_moves_end_date(client):
    end0 = client.get("/api/plan/summary").json()["end"]
    cap = {"0": 180, "1": 180, "2": 180, "3": 180, "4": 180, "5": 240, "6": 0}
    r = client.put("/api/settings", json={"capacity": cap}).json()
    assert r["end"] < end0


def test_export_import_and_backup_restore(client, tmp_path):
    client.post("/api/sessions", json={"date": "2026-11-13", "type": "PRACTICE", "title": "teste", "actual_min": 25})
    exp = client.get("/api/export")
    assert exp.status_code == 200 and b"teste" in exp.content
    bk = client.get("/api/backup")
    assert bk.status_code == 200 and bk.content[:15] == b"SQLite format 3"
    client.post("/api/sessions", json={"date": "2026-11-13", "type": "PRACTICE", "title": "depois", "actual_min": 25})
    assert len(client.get("/api/sessions").json()["sessions"]) == 2
    r = client.post("/api/restore", files={"file": ("b.db", bk.content, "application/octet-stream")})
    assert r.status_code == 200, r.text
    assert [s["title"] for s in client.get("/api/sessions").json()["sessions"]] == ["teste"]
    r = client.post("/api/import", files={"file": ("e.json", exp.content, "application/json")})
    assert r.status_code == 200 and r.json()["imported"]["sessions"] == 1
    assert client.post("/api/restore", files={"file": ("x.db", b"not a db", "application/octet-stream")}).status_code == 400
    assert client.post("/api/import", files={"file": ("x.json", b"{}", "application/json")}).status_code == 400


def test_catalog_import_endpoint_validates(client):
    r = client.post("/api/catalog/import", json={"tracks": [], "contents": {}})
    assert r.status_code == 422


def test_static_pwa_assets(client):
    assert client.get("/").status_code == 200
    m = client.get("/manifest.webmanifest")
    assert m.status_code == 200 and m.json()["display"] == "standalone"
    sw = client.get("/sw.js")
    assert sw.status_code == 200 and "no-cache" in sw.headers["cache-control"]


def test_dashboard_separates_formation_from_total_time(client):
    d = client.get("/api/dashboard").json()
    p = d["load"]["planned"]
    assert abs(p["formation"] - 1790) < 15
    assert p["total"] == pytest.approx(p["formation"] + p["practice"] + p["project"] + p["review"])
    assert p["total"] > p["formation"] * 2   # formação não é "o tempo total"
    c = d["catalog"]
    assert c["declared_min"] == 3754 and c["identified_unique_min"] == 1790 and c["unidentified_min"] == 1938
    assert all(t["to_confirm"] for t in d["tracks"])


def test_reviews_today_counter(client, set_today):
    cid = "GENAI-001.COURSE"
    client.post(f"/api/lessons/{cid}/toggle", json={"completed": True})
    assert client.get("/api/dashboard").json()["reviews_today"]["pending"] == 0
    set_today("2026-11-14")
    d = client.get("/api/dashboard").json()
    assert d["reviews_today"]["pending"] >= 1
    key = next(r["key"] for r in client.get("/api/reviews").json()["reviews"] if r["interval"] == 1)
    client.post(f"/api/reviews/{key}/done")
    d = client.get("/api/dashboard").json()
    assert d["reviews_today"]["done"] == 1


def test_course_unit_auto_completes_at_95_percent(client):
    c = client.get("/api/contents/CODE-001").json()
    unit = c["modules"][0]["lessons"][0]
    assert unit["id"] == "CODE-001.COURSE" and unit["duration_min"] == 26
    base = {"date": "2026-11-13", "type": "VIDEO", "target_kind": "lesson", "target_id": unit["id"], "title": "x"}
    client.post("/api/sessions", json={**base, "actual_min": 10})
    assert client.get("/api/contents/CODE-001").json()["modules"][0]["lessons"][0]["completed_on"] is None
    client.post("/api/sessions", json={**base, "actual_min": 15})
    assert client.get("/api/contents/CODE-001").json()["modules"][0]["lessons"][0]["completed_on"] == "2026-11-13"


def test_plan_sessions_are_plan_artifacts_and_follow_real_duration(client):
    cal = client.get("/api/calendar?start=2026-11-13&end=2027-01-31").json()["days"]
    vid = sum(i["minutes"] for d in cal for i in d["items"] if i["kind"] == "video" and i["content_id"] == "GENAI-001")
    assert abs(vid - 92) < 3                                   # soma das sessões = duração real
    assert all(i["minutes"] <= 50 for d in cal for i in d["items"] if i["kind"] == "video")   # sessões ≤ bloco configurado


def test_practice_override_is_configurable_and_separate_from_real_duration(client):
    before = client.get("/api/catalog").json()["courses"]
    c0 = next(c for c in before if c["id"] == "GENAI-001")
    r = client.put("/api/settings", json={"practice_overrides": {"GENAI-001": 1.0}})
    assert r.status_code == 200
    after = next(c for c in client.get("/api/catalog").json()["courses"] if c["id"] == "GENAI-001")
    assert after["duration_min"] == c0["duration_min"] == 92      # duração real intacta
    assert after["practice_est_min"] > c0["practice_est_min"]
    assert client.put("/api/settings", json={"practice_overrides": {"GENAI-001": 9}}).status_code == 422


def test_competency_baselines_editable(client):
    base = {c["id"]: c for c in client.get("/api/competencies").json()["competencies"]}
    assert base["rag"]["baseline"] == 0
    client.put("/api/settings", json={"competency_baselines": {"rag": 0.3}})
    after = {c["id"]: c for c in client.get("/api/competencies").json()["competencies"]}
    assert after["rag"]["baseline"] == 0.3 and after["rag"]["level"] >= 0.3
    assert client.put("/api/settings", json={"competency_baselines": {"nope": 0.3}}).status_code == 422


def test_lan_flag_and_import_makes_safety_backup(client, monkeypatch, tmp_path):
    assert client.get("/api/health").json()["lan"] is False
    monkeypatch.setenv("AST_LAN", "1")
    assert client.get("/api/health").json()["lan"] is True
    exp = client.get("/api/export").content
    client.post("/api/import", files={"file": ("e.json", exp, "application/json")})
    assert any("antes-de-importar" in f.name for f in (tmp_path / "backups").iterdir())


def test_restore_rejects_corrupt_and_creates_safety_backup(client, tmp_path):
    bk = client.get("/api/backup").content
    assert client.post("/api/restore", files={"file": ("b.db", bk, "application/octet-stream")}).json()["safety_backup"].startswith("antes-de-restaurar")
    assert client.post("/api/restore", files={"file": ("x.db", b"SQLite format 3\x00" + b"junk" * 50, "application/octet-stream")}).status_code == 400
