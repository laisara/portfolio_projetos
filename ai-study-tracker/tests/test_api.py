import pytest


def lessons_of(client, cid, required_only=True):
    c = client.get(f"/api/contents/{cid}").json()
    return [l for m in c["modules"] for l in m["lessons"] if (l["required"] or not required_only)]


def track(client, tid):
    return next(t for t in client.get("/api/dashboard").json()["tracks"] if t["id"] == tid)


# ---------------------------------------------------------------- catálogo e planejamento
def test_bootstrap_dashboard_and_numbers(client):
    d = client.get("/api/dashboard").json()
    assert d["overall"] == 0 and d["xp"] == 0 and d["level"]["name"] == "Explorer"
    assert d["courses"] == {"done": 0, "total": 42} and d["lessons"]["total"] == 462   # 463 − aviso "em breve"
    assert d["catalog"]["unique_min"] == pytest.approx(3981.62, abs=0.1) and d["catalog"]["declared_min"] == 3754
    assert d["today"]["items"], "o primeiro dia (13/11) tem estudo planejado"
    assert len(d["tracks"]) == 8 and all(t["title"] for t in d["tracks"])


def test_dashboard_separates_formation_from_total_time(client):
    L = client.get("/api/dashboard").json()["load"]["planned"]
    assert L["formation"] == pytest.approx(3981.62, abs=0.01)       # só a soma das aulas (66h21m37s)
    assert L["practice"] > 0 and L["project"] == 18 * 60 and L["review"] > 0
    assert L["total"] == pytest.approx(L["formation"] + L["practice"] + L["project"] + L["review"])
    assert L["total"] > L["formation"] + 30 * 60


def test_plan_covers_all_unique_content_with_lessons_and_reviews_only(client):
    s = client.get("/api/plan/summary").json()
    assert s["start"] == "2026-11-13" and "2026-12-20" < s["lessons_end"] < "2027-01-20"
    assert "2027-01-10" < s["work_end"] < "2027-01-31" and "2027-01-25" < s["end"] < "2027-02-20"   # revisões D+30 depois
    assert abs(s["totals"]["video"] - 3981.6) < 3 and set(s["totals"]) == {"video", "practice", "project", "review"}
    assert s["rest_days"] >= 5 and 100 <= s["avg_per_study_day"] <= 160 and s["review_only_days"] > 5
    cal = client.get("/api/calendar?start=2026-11-13&end=2027-01-31").json()["days"]
    assert {i["kind"] for d in cal for i in d["items"]} == {"video", "practice", "project", "review"}


def test_rest_day_and_holidays_have_nothing(client):
    cal = client.get("/api/calendar?start=2026-11-15&end=2026-11-15").json()["days"][0]
    assert cal["rest"] and cal["planned_total"] == 0
    assert client.get("/api/calendar?start=2026-12-25&end=2026-12-25").json()["days"][0]["planned_total"] == 0


def test_weekday_load_within_requested_range(client):
    days = client.get("/api/calendar?start=2026-11-16&end=2026-12-20").json()["days"]
    for d in days:
        if d["weekday"] < 5:
            assert d["planned_total"] <= 135 + 12
        if d["weekday"] == 5:
            assert d["planned_total"] <= 210 + 12
        if d["weekday"] == 6:
            assert d["planned_total"] == 0


# ---------------------------------------------------------------- progresso compartilhado
def test_completing_repeated_course_completes_it_in_every_track(client):
    c = client.get("/api/contents/GENAI-001").json()
    in_tracks = [t["id"] for t in c["tracks"]]
    assert sorted(in_tracks) == ["T1", "T2", "T3", "T4", "T5", "T8"]
    before = {t: track(client, t)["courses_done"] for t in in_tracks}
    r = client.post("/api/contents/GENAI-001/complete", json={"completed": True})
    assert r.status_code == 200
    assert client.get("/api/contents/GENAI-001").json()["progress"]["complete"] is True
    for t in in_tracks:
        assert track(client, t)["courses_done"] == before[t] + 1
    # desmarcar reverte em todas
    client.post("/api/contents/GENAI-001/complete", json={"completed": False})
    for t in in_tracks:
        assert track(client, t)["courses_done"] == before[t]


def test_lesson_and_module_progress_is_shared_across_tracks(client):
    first = lessons_of(client, "GENAI-001")[0]["id"]
    client.post(f"/api/lessons/{first}/toggle", json={"completed": True})
    for t in ("T1", "T2", "T3", "T4", "T5"):
        assert track(client, t)["lessons_done"] >= 1
    mod = client.get("/api/contents/GENAI-001").json()["modules"][0]["id"]
    client.post(f"/api/modules/{mod}/complete", json={"completed": True})
    assert client.get("/api/contents/GENAI-001").json()["modules"][0]["complete"] is True
    assert client.get("/api/dashboard").json()["courses"]["done"] == 1


def test_shared_course_counts_once_in_totals_xp_and_plan(client):
    client.post("/api/contents/GENAI-001/complete", json={"completed": True})
    g = client.get("/api/gamification").json()
    assert len([e for e in g["ledger"] if e["kind"] == "CONTENT"]) == 1
    assert len([e for e in g["ledger"] if e["kind"] == "LESSON"]) == 9
    assert client.get("/api/dashboard").json()["lessons"]["done"] == 9
    refs = [i["ref"] for d in client.get("/api/calendar?start=2026-11-13&end=2027-01-31").json()["days"] for i in d["items"] if i["kind"] == "video"]
    assert not any(r.startswith("GENAI-001") for r in refs)


def test_course_with_quizzes_requires_every_lesson_including_quizzes(client):
    ls = lessons_of(client, "LOGIC-001")
    quizzes = [l for l in ls if not l["has_duration"]]
    assert quizzes and all(l["kind"] in ("quiz", "test") for l in quizzes)
    for l in ls:
        if l["has_duration"]:
            client.post(f"/api/lessons/{l['id']}/toggle", json={"completed": True})
    assert client.get("/api/contents/LOGIC-001").json()["progress"]["complete"] is False
    for l in quizzes:
        client.post(f"/api/lessons/{l['id']}/toggle", json={"completed": True})
    assert client.get("/api/contents/LOGIC-001").json()["progress"]["complete"] is True


def test_placeholder_does_not_block_course_completion(client):
    client.post("/api/contents/CODE-002/complete", json={"completed": True})
    c = client.get("/api/contents/CODE-002").json()
    assert c["progress"]["complete"] is True
    ph = [l for m in c["modules"] for l in m["lessons"] if l["kind"] == "placeholder"]
    assert len(ph) == 1 and ph[0]["required"] is False and ph[0]["completed_on"] is None


def test_zero_duration_lessons_are_flagged_for_dash_display(client):
    l = next(x for x in lessons_of(client, "PY-001") if x["num"] == 4)
    assert l["has_duration"] == 0 and l["duration_min"] == 0 and l["title"].startswith("Quiz")


def test_track_completes_when_all_its_courses_complete(client):
    for c in client.get("/api/catalog").json()["courses"]:
        if "T4" in c["tracks"]:
            client.post(f"/api/contents/{c['id']}/complete", json={"completed": True})
    t4 = track(client, "T4")
    assert t4["complete"] and t4["pct"] == 1.0
    assert not track(client, "T1")["complete"]
    ach = {a["id"]: a for a in client.get("/api/gamification").json()["achievements"]}
    assert ach["first_track"]["unlocked"]


# ---------------------------------------------------------------- sessões, XP, revisão
def test_session_awards_xp_completes_lesson_and_recalculates(client):
    item = next(i for i in client.get("/api/today").json()["items"] if i["kind"] == "video" and i["minutes"] >= 5)
    r = client.post("/api/sessions", json={"date": "2026-11-13", "type": "VIDEO", "target_kind": "lesson", "target_id": item["ref"],
                                           "title": item["title"], "planned_min": item["minutes"], "actual_min": item["minutes"],
                                           "complete_lessons": [item["ref"]], "focus": True})
    assert r.status_code == 201
    body = r.json()
    assert body["xp_gained"] >= round(item["minutes"]) + 15 and "Primeiro passo" in body["new_achievements"]
    assert item["ref"] not in [i["ref"] for i in client.get("/api/today").json()["items"] if i["kind"] == "video"]


def test_video_session_auto_completes_lesson_at_95_percent(client):
    l = next(x for x in lessons_of(client, "CODE-001"))
    assert l["duration_min"] == pytest.approx(26.37, abs=0.01)
    base = {"date": "2026-11-13", "type": "VIDEO", "target_kind": "lesson", "target_id": l["id"], "title": "x"}
    client.post("/api/sessions", json={**base, "actual_min": 10})
    assert client.get("/api/contents/CODE-001").json()["modules"][0]["lessons"][0]["completed_on"] is None
    client.post("/api/sessions", json={**base, "actual_min": 16})
    assert client.get("/api/contents/CODE-001").json()["modules"][0]["lessons"][0]["completed_on"] == "2026-11-13"


def test_practice_and_project_sessions_are_manual_and_worth_more_xp(client):
    base = {"date": "2026-11-13", "title": "x", "actual_min": 30}
    for t in ("VIDEO", "PRACTICE"):
        client.post("/api/sessions", json={**base, "type": t, "actual_min": 1})
    v = client.post("/api/sessions", json={**base, "type": "VIDEO"}).json()["xp_gained"]
    p = client.post("/api/sessions", json={**base, "type": "PRACTICE"}).json()["xp_gained"]
    j = client.post("/api/sessions", json={**base, "type": "PROJECT"}).json()["xp_gained"]
    assert v < p < j
    # prática manual não altera o plano nem o progresso do conteúdo
    assert client.get("/api/dashboard").json()["overall"] == 0


def test_adaptive_delay_keeps_history_and_moves_end(client, set_today):
    end0 = client.get("/api/dashboard").json()["lessons_end"]
    set_today("2026-11-16")  # 13/11 e 14/11 sem estudo
    d = client.get("/api/dashboard").json()
    assert d["lessons_end"] >= end0
    cal = client.get("/api/calendar?start=2026-11-13&end=2026-11-13").json()["days"][0]
    assert cal["planned_total"] > 0, "o plano do dia passado continua visível como histórico"


def test_adaptive_ahead_brings_future_earlier(client):
    end0 = client.get("/api/dashboard").json()["lessons_end"]
    client.post("/api/contents/CLAUDE-001/complete", json={"completed": True})
    client.post("/api/contents/CLAUDE-002/complete", json={"completed": True})
    assert client.get("/api/dashboard").json()["lessons_end"] <= end0


def test_review_flow_and_reviews_today_counter(client, set_today):
    lid = lessons_of(client, "START-CLAUDE")[0]["id"]
    client.post("/api/contents/GENAI-001/complete", json={"completed": True})
    client.post(f"/api/lessons/{lid}/toggle", json={"completed": True})
    assert client.get("/api/dashboard").json()["reviews_today"]["pending"] == 0
    set_today("2026-11-14")
    assert client.get("/api/dashboard").json()["reviews_today"]["pending"] >= 1
    assert client.get("/api/today").json()["items"][0]["kind"] == "review"
    key = next(r["key"] for r in client.get("/api/reviews").json()["reviews"] if r["interval"] == 1)
    assert client.post(f"/api/reviews/{key}/done").json()["xp_gained"] >= 15
    assert client.get("/api/dashboard").json()["reviews_today"]["done"] == 1


def test_validation_errors(client):
    bad = {"date": "2026-11-13", "type": "VIDEO", "title": "x", "actual_min": 10}
    assert client.post("/api/sessions", json={**bad, "title": ""}).status_code == 422
    assert client.post("/api/sessions", json={**bad, "type": "BOGUS"}).status_code == 422
    assert client.post("/api/sessions", json={**bad, "target_kind": "stage"}).status_code == 422
    assert client.post("/api/sessions", json={**bad, "actual_min": 0}).status_code == 400
    assert client.post("/api/sessions", json={**bad, "date": "2030-01-01"}).status_code == 400
    assert client.post("/api/sessions", json={**bad, "complete_lessons": ["NOPE"]}).status_code == 400
    assert client.put("/api/settings", json={"capacity": {"0": 999}}).status_code == 422
    assert client.post("/api/lessons/NOPE/toggle", json={"completed": True}).status_code == 404
    assert client.post("/api/contents/NOPE/complete", json={"completed": True}).status_code == 404


def test_settings_change_moves_end_date_and_competency_baselines(client):
    end0 = client.get("/api/plan/summary").json()["end"]
    cap = {"0": 180, "1": 180, "2": 180, "3": 180, "4": 180, "5": 240, "6": 0}
    assert client.put("/api/settings", json={"capacity": cap}).json()["end"] < end0
    base = {c["id"]: c for c in client.get("/api/competencies").json()["competencies"]}
    assert base["rag"]["baseline"] == 0
    client.put("/api/settings", json={"competency_baselines": {"rag": 0.3}})
    after = {c["id"]: c for c in client.get("/api/competencies").json()["competencies"]}
    assert after["rag"]["baseline"] == 0.3 and after["rag"]["level"] >= 0.3
    assert client.put("/api/settings", json={"competency_baselines": {"nope": 0.3}}).status_code == 422


def test_competencies_grow_with_completed_courses(client):
    before = {c["id"]: c["level"] for c in client.get("/api/competencies").json()["competencies"]}
    client.post("/api/contents/PYTHON-001/complete", json={"completed": True})
    after = {c["id"]: c["level"] for c in client.get("/api/competencies").json()["competencies"]}
    assert after["python"] > before["python"] and after["agents"] == before["agents"]


# ---------------------------------------------------------------- escopo, dados e PWA
def test_lab_has_nine_simple_stages(client):
    st = client.get("/api/lab").json()["stages"]
    assert [s["title"] for s in st] == ["LLM", "Prompt Engineering", "APIs", "Tool Calling", "Agents", "RAG", "Multi-Agent", "AI Applications", "Projeto Final"]
    assert all(s["status"] == "todo" and s["practice"] for s in st)
    assert client.patch("/api/lab/stages/LAB-1", json={"status": "doing"}).status_code == 200
    assert client.patch("/api/lab/stages/LAB-1", json={"status": "xx"}).status_code == 422
    assert client.get("/api/lab").json()["stages"][0]["status"] == "doing"


def test_export_import_backup_restore(client, tmp_path):
    client.post("/api/sessions", json={"date": "2026-11-13", "type": "PRACTICE", "title": "teste", "actual_min": 25})
    exp = client.get("/api/export")
    assert exp.status_code == 200 and b"teste" in exp.content
    bk = client.get("/api/backup")
    assert bk.status_code == 200 and bk.content[:15] == b"SQLite format 3"
    client.post("/api/sessions", json={"date": "2026-11-13", "type": "PRACTICE", "title": "depois", "actual_min": 25})
    r = client.post("/api/restore", files={"file": ("b.db", bk.content, "application/octet-stream")})
    assert r.status_code == 200 and r.json()["safety_backup"].startswith("antes-de-restaurar")
    assert [s["title"] for s in client.get("/api/sessions").json()["sessions"]] == ["teste"]
    assert client.post("/api/import", files={"file": ("e.json", exp.content, "application/json")}).json()["imported"]["sessions"] == 1
    assert any("antes-de-importar" in f.name for f in (tmp_path / "backups").iterdir())
    assert client.post("/api/restore", files={"file": ("x.db", b"not a db", "application/octet-stream")}).status_code == 400
    assert client.post("/api/restore", files={"file": ("x.db", b"SQLite format 3\x00" + b"junk" * 50, "application/octet-stream")}).status_code == 400
    assert client.post("/api/import", files={"file": ("x.json", b"{}", "application/json")}).status_code == 400


def test_catalog_import_endpoint_validates_and_marks_customized(client):
    assert client.post("/api/catalog/import", json={"tracks": [], "contents": {}}).status_code == 422


def test_static_pwa_assets_desktop_only(client):
    assert client.get("/").status_code == 200
    m = client.get("/manifest.webmanifest").json()
    assert m["display"] == "standalone" and any("maskable" in i["src"] for i in m["icons"])
    assert all(client.get(i["src"]).status_code == 200 for i in m["icons"])
    sw = client.get("/sw.js")
    assert sw.status_code == 200 and "no-cache" in sw.headers["cache-control"]
    for f in ("/js/views/reviews.js", "/js/views/projects.js", "/js/views/lab.js"):
        assert f in sw.text and client.get(f).status_code == 200
    html = client.get("/").text
    assert "tabbar" in html and "viewport-fit=cover" in html and "apple-touch-icon" in html
    css = client.get("/css/app.css").text
    assert "backdrop-filter" in css and ".tabbar" in css and "max-width: 820px" in css


# ---------------------------------------------------------------- curso opcional (Git e GitHub)
def test_optional_course_is_registered_but_outside_progress_tracks_and_plan(client):
    cat = client.get("/api/catalog").json()
    assert [c["id"] for c in cat["optional"]] == ["GIT-001"] and len(cat["courses"]) == 42
    assert all("GIT-001" not in [c["id"] for c in t["courses"]] for t in cat["tracks"])
    d = client.get("/api/dashboard").json()
    assert d["courses"]["total"] == 42 and d["lessons"]["total"] == 462
    refs = [i["ref"] or "" for x in client.get("/api/calendar?start=2026-11-13&end=2027-03-01").json()["days"] for i in x["items"]]
    assert not any(r.startswith("GIT-001") for r in refs)
    c = client.get("/api/contents/GIT-001").json()
    assert c["optional"] == 1 and c["lesson_count"] == 20 and c["tracks"] == []
    assert sum(1 for m in c["modules"] for l in m["lessons"] if not l["has_duration"]) == 6


def test_studying_optional_course_keeps_progress_without_touching_overall(client):
    before = client.get("/api/dashboard").json()
    client.post("/api/contents/GIT-001/complete", json={"completed": True})
    c = client.get("/api/contents/GIT-001").json()
    assert c["progress"]["complete"] is True and c["progress"]["lessons_done"] == 20
    after = client.get("/api/dashboard").json()
    assert after["overall"] == before["overall"] == 0 and after["courses"]["done"] == 0
    assert after["lessons"]["done"] == 0
    g = client.get("/api/gamification").json()
    assert not [e for e in g["ledger"] if e["kind"] == "CONTENT"]      # curso opcional não gera "curso concluído"
    assert len([e for e in g["ledger"] if e["kind"] == "LESSON"]) == 20  # mas as aulas rendem XP
    client.post("/api/contents/GIT-001/complete", json={"completed": False})
    assert client.get("/api/contents/GIT-001").json()["progress"]["lessons_done"] == 0


# ---------------------------------------------------------------- MVP: fluxo de uso, revisões, projetos, prática
def test_mvp_flow_study_now_complete_progress_xp_next_review_persistence(client, set_today):
    d0 = client.get("/api/dashboard").json()
    sn = d0["study_now"]
    assert sn["today"] and sn["kind"] == "video" and sn["title"]
    item = sn["item"]
    r = client.post("/api/sessions", json={"date": "2026-11-13", "type": "VIDEO", "target_kind": "lesson", "target_id": item["ref"], "title": item["title"],
                                           "planned_min": item["minutes"], "actual_min": max(1, item["minutes"]), "complete_lessons": [item["ref"]], "focus": True}).json()
    assert r["xp_gained"] > 0
    d1 = client.get("/api/dashboard").json()
    assert d1["overall"] > d0["overall"] and d1["xp"] > d0["xp"] and d1["lessons"]["done"] == d0["lessons"]["done"] + 1
    assert d1["study_now"]["item"]["ref"] != item["ref"]                       # a aula deixa de ser pendente; aparece a próxima
    pend = [i["ref"] for i in client.get("/api/today").json()["items"] if i["kind"] == "video"]
    assert item["ref"] not in pend
    set_today("2026-11-14")                                                       # revisão D+1 criada
    rv = client.get("/api/reviews/today").json()
    assert rv["due"] and rv["due"][0]["interval"] == 1 and rv["due"][0]["courses"]
    assert client.post(f"/api/reviews/{rv['due'][0]['key']}/done").json()["xp_gained"] >= 15
    assert client.get("/api/reviews/today").json()["done_today"] == 1
    assert client.get("/api/dashboard").json()["lessons"]["done"] == d1["lessons"]["done"]    # persistência (novo request = "reabrir")


def test_zero_duration_item_completes_without_session(client):
    lid = next(l["id"] for l in lessons_of(client, "LOGIC-001") if not l["has_duration"])
    r = client.post(f"/api/lessons/{lid}/toggle", json={"completed": True})
    assert r.status_code == 200 and r.json()["xp_gained"] == 15


def test_practice_is_estimated_separately_and_credited_by_sessions(client):
    c = client.get("/api/contents/AGNO-001").json()
    est = c["practice_estimate"]
    assert est["ratio"] == 0.30 and est["minutes"] > 100 and est["activities"] == 8       # 30% do vídeo + atividades sem duração
    assert client.get("/api/contents/LOGIC-001").json()["practice_estimate"]["ratio"] == 0.05      # você já domina lógica/Python
    assert client.get("/api/contents/START-GPT").json()["practice_estimate"]["minutes"] == 0
    assert client.get("/api/catalog").json()["analysis"]["unique_min"] == pytest.approx(3981.62, abs=0.01)   # oficial não muda
    before = sum(i["minutes"] for d in client.get("/api/calendar?start=2026-11-13&end=2027-03-01").json()["days"] for i in d["items"] if i["kind"] == "practice" and i["ref"] == "AGNO-001")
    client.post("/api/sessions", json={"date": "2026-11-13", "type": "PRACTICE", "target_kind": "content", "target_id": "AGNO-001", "title": "Prática Agno", "actual_min": 60})
    after = sum(i["minutes"] for d in client.get("/api/calendar?start=2026-11-13&end=2027-03-01").json()["days"] for i in d["items"] if i["kind"] == "practice" and i["ref"] == "AGNO-001")
    assert before - after == pytest.approx(60, abs=5)


def test_projects_checklist_progress_status_and_xp(client):
    ps = client.get("/api/projects").json()["projects"]
    assert [p["id"] for p in ps] == ["PROJ-1", "PROJ-2", "PROJ-3", "PROJ-FINAL"] and all(p["status"] == "todo" for p in ps)
    assert sum(p["planned_hours"] for p in ps) == 18 and not ps[0]["unlocked"]
    items = ps[0]["items"]
    r = client.post(f"/api/projects/items/{items[0]['id']}/toggle").json()
    assert r["xp_gained"] == 20
    p1 = client.get("/api/projects").json()["projects"][0]
    assert p1["status"] == "doing" and p1["progress"] == 1 / len(items)
    for it in items[1:]:
        client.post(f"/api/projects/items/{it['id']}/toggle")
    assert client.get("/api/projects").json()["projects"][0]["status"] == "done"
    g = client.get("/api/gamification").json()
    assert any(e["kind"] == "PROJECT_DONE" for e in g["ledger"]) and {a["id"]: a for a in g["achievements"]}["first_project"]["unlocked"]


def test_week_summary_and_greeting(client):
    d = client.get("/api/dashboard").json()
    assert d["week"]["start"] == "2026-11-09" and d["week"]["planned_min"] > 0 and d["greeting"] in ("Bom dia", "Boa tarde", "Boa noite")
    client.post("/api/sessions", json={"date": "2026-11-13", "type": "VIDEO", "title": "x", "actual_min": 30})
    w = client.get("/api/dashboard").json()["week"]
    assert w["sessions"] == 1 and w["studied_min"] == 30 and 0 < w["pct"] < 1


def test_lesson_kinds_quiz_test_guide_other(client):
    kinds = {}
    for cid in ("PY-001", "PY-002", "GPT-001"):
        for l in lessons_of(client, cid):
            if not l["has_duration"]:
                kinds.setdefault(cid, set()).add(l["kind"])
    assert kinds["PY-001"] == {"quiz", "test"} and kinds["PY-002"] == {"guide"} and kinds["GPT-001"] == {"other"}


# ---------------------------------------------------------------- segurança dos dados / launcher
def test_health_identifies_app_for_launcher(client):
    h = client.get("/api/health").json()
    assert h["ok"] is True and h["app"] == "ai-study-tracker"


def test_shutdown_requires_header_and_makes_backup(client, monkeypatch):
    monkeypatch.setenv("AST_NO_EXIT", "1")
    assert client.post("/api/shutdown").status_code == 403           # sem o cabeçalho (ex.: página de outro site)
    assert client.post("/api/shutdown", headers={"X-AST": "1"}).json() == {"ok": True}
    kinds = {b["kind"] for b in client.get("/api/backups").json()["items"]}
    assert "ao-encerrar" in kinds


def test_auto_backup_throttles_prunes_and_never_touches_manual(client):
    from backend.app import backup, config
    first = backup.auto_backup("auto", 12)
    assert first and first.exists()
    assert backup.auto_backup("auto", 12) is None                     # já existe um recente
    manual = backup.backup_to_file(label="backup")
    d = config.backup_dir()
    for i in range(backup.AUTO_KEEP + 5):                             # simula muitos backups antigos
        f = d / f"auto-20200101-{i:06d}.db"
        f.write_bytes(b"x")
        import os; os.utime(f, (1, 1))
    backup.auto_backup("auto", 0)
    assert len(list(d.glob("auto-*.db"))) <= backup.AUTO_KEEP
    assert manual.exists()                                            # manual nunca é podado


def test_restore_invalid_file_keeps_current_data(client):
    client.post("/api/lessons/START-CLAUDE.L01/toggle", json={"completed": True})
    before = client.get("/api/dashboard").json()["lessons"]["done"]
    r = client.post("/api/restore", files={"file": ("x.db", b"isto nao e um banco", "application/octet-stream")})
    assert r.status_code == 400
    assert client.get("/api/dashboard").json()["lessons"]["done"] == before == 1


def test_import_json_bad_row_rolls_back_and_keeps_data(client):
    client.post("/api/lessons/START-CLAUDE.L01/toggle", json={"completed": True})
    bad = {"app": "ai-study-tracker", "tables": {"lesson_progress": [{"coluna_inexistente": 1}]}}
    import json
    r = client.post("/api/import", files={"file": ("x.json", json.dumps(bad).encode(), "application/json")})
    assert r.status_code >= 400
    assert client.get("/api/dashboard").json()["lessons"]["done"] == 1


def test_restore_valid_backup_roundtrip_creates_safety_backup(client):
    client.post("/api/lessons/START-CLAUDE.L01/toggle", json={"completed": True})
    snap = client.get("/api/backup").content
    client.post("/api/lessons/START-CLAUDE.L01/toggle", json={"completed": False})
    assert client.get("/api/dashboard").json()["lessons"]["done"] == 0
    r = client.post("/api/restore", files={"file": ("b.db", snap, "application/octet-stream")}).json()
    assert r["restored"] and r["safety_backup"].startswith("antes-de-restaurar")
    assert client.get("/api/dashboard").json()["lessons"]["done"] == 1


# ---------------------------------------------------------------- estimativas e adiamento
def test_editing_estimates_never_changes_official_duration(client):
    before = client.get("/api/plan/summary").json()["totals"]
    assert client.put("/api/settings", json={"practice_scale": 0.5}).status_code == 200
    mid = client.get("/api/plan/summary").json()["totals"]
    assert mid["practice"] < before["practice"] * 0.7 and mid["video"] == pytest.approx(before["video"])
    pid = client.get("/api/projects").json()["projects"][0]["id"]
    assert client.patch(f"/api/projects/{pid}", json={"planned_hours": 6}).status_code == 200
    after = client.get("/api/plan/summary").json()["totals"]
    assert after["project"] > before["project"] and after["video"] == pytest.approx(3981.62, abs=0.01)
    assert client.patch(f"/api/projects/{pid}", json={"planned_hours": 0}).status_code == 422


def test_postpone_day_becomes_rest_keeps_all_lessons_and_past_untouched(client):
    client.post("/api/lessons/START-CLAUDE.L01/toggle", json={"completed": True})
    cfg = client.get("/api/settings").json()
    hol = {**cfg["holidays"], "2026-11-17": 0}
    assert client.put("/api/settings", json={"holidays": hol}).status_code == 200
    day = next(d for d in client.get("/api/calendar?start=2026-11-17&end=2026-11-17").json()["days"] if d["date"] == "2026-11-17")
    assert day["rest"] and not day["items"]
    assert client.get("/api/dashboard").json()["lessons"] == {"done": 1, "total": 462}      # concluída continua concluída
    assert client.get("/api/plan/summary").json()["totals"]["video"] == pytest.approx(3981.62 - 1.4 * 1, abs=2)   # só o futuro


def test_study_now_has_track_and_status(client):
    sn = client.get("/api/dashboard").json()["study_now"]
    assert sn["track"] and sn["track_ord"] == 1 and sn["status"] == "Não iniciada" and sn["course"]
