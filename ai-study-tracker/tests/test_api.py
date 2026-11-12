from datetime import date


def test_bootstrap_dashboard_and_plan(client):
    d = client.get("/api/dashboard").json()
    assert d["overall"] == 0 and d["xp"] == 0 and d["level"]["name"] == "Explorer"
    assert d["today"]["items"], "o primeiro dia (13/11) deve ter estudo planejado"
    s = client.get("/api/plan/summary").json()
    assert s["start"] == "2026-11-13"
    assert s["end"] and s["end"] > "2027-01-01"
    assert s["rest_days"] >= 10
    assert 100 <= s["avg_per_study_day"] <= 150


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
