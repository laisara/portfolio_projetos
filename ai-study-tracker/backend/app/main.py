"""AI Engineer Study Tracker — API FastAPI + PWA estático (local-first)."""
from __future__ import annotations

import json
import os
import sqlite3
from contextlib import asynccontextmanager
from datetime import date, timedelta
from typing import Literal, Optional

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, ValidationError, field_validator

from . import backup as backup_mod
from . import catalog as catalog_mod
from . import config, db, gamification, lab, services, tracker
from . import settings as settings_mod
from .db import get_conn


def bootstrap() -> None:
    with db.session_scope() as conn:
        db.init_schema(conn)
        cfg = settings_mod.load(conn)
        catalog_mod.ensure_catalog(conn, config.catalog_path())
        lab.seed_lab(conn, config.lab_path())
        tracker.ensure_plan_fresh(conn)
        services.plan_summary(conn)  # grava a data final do plano original


@asynccontextmanager
async def lifespan(app: FastAPI):
    bootstrap()
    yield


app = FastAPI(title="AI Engineer Study Tracker", version=config.APP_VERSION, lifespan=lifespan)


@app.exception_handler(ValueError)
async def _value_error(_: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(KeyError)
async def _key_error(_: Request, exc: KeyError):
    return JSONResponse(status_code=404, content={"detail": f"Não encontrado: {exc.args[0] if exc.args else ''}"})


def _xp_state(conn: sqlite3.Connection) -> dict:
    snap = services.snapshot(conn)
    return {"xp": snap["game"]["xp"], "level": snap["game"]["level"],
            "achievements": {a["id"] for a in snap["game"]["achievements"] if a["unlocked"]},
            "titles": {a["id"]: a["title"] for a in snap["game"]["achievements"]}}


def _reward(conn: sqlite3.Connection, before: dict, reason: str) -> dict:
    plan = tracker.recalculate(conn, reason)
    after = _xp_state(conn)
    return {"xp_gained": after["xp"] - before["xp"], "xp": after["xp"], "level": after["level"],
            "level_up": after["level"]["id"] > before["level"]["id"],
            "new_achievements": [after["titles"][a] for a in sorted(after["achievements"] - before["achievements"])],
            "plan_end": plan["end_date"]}


# ------------------------------------------------------------------- básicos
@app.get("/api/health")
def health(conn: sqlite3.Connection = Depends(get_conn)):
    return {"ok": True, "version": config.APP_VERSION, "today": config.today().isoformat(),
            "db": str(config.db_path()), "lan": os.environ.get("AST_LAN") == "1"}


@app.get("/api/dashboard")
def dashboard(conn: sqlite3.Connection = Depends(get_conn)):
    return services.dashboard(conn)


# ------------------------------------------------------------------- catálogo
@app.get("/api/catalog")
def get_catalog(conn: sqlite3.Connection = Depends(get_conn)):
    snap = services.snapshot(conn)
    cfg = snap["cfg"]
    apps: dict[str, list] = {}
    for a in db.rows(conn, "SELECT * FROM appearances ORDER BY position"):
        apps.setdefault(a["content_id"], []).append(a)
    courses = []
    for c in snap["cat"]["contents"].values():
        pc = snap["prog"]["per_content"][c["id"]]
        courses.append({"id": c["id"], "title": c["title"], "instructor": c["instructor"], "nature": c["nature"],
                        "duration_min": c["duration_min"], "lesson_count": c["lesson_count"] if c["lessons_known"] or c["lesson_count"] else None,
                        "lessons_identified": bool(c["lessons_known"]), "intro": bool(c["intro"]),
                        "practice_ratio": tracker.practice_ratio(c, cfg), "practice_est_min": pc["practice_total"],
                        "confidence": db.loads(c["confidence"], {}), "appearances": apps.get(c["id"], []),
                        "pct": pc["pct"], "study_ord": c["study_ord"]})
    return {"analysis": catalog_mod.analysis(conn), "tracks": services.tracks_progress(conn, snap), "courses": courses}


@app.get("/api/contents/{content_id}")
def get_content(content_id: str, conn: sqlite3.Connection = Depends(get_conn)):
    snap = services.snapshot(conn)
    c = snap["cat"]["contents"].get(content_id)
    if not c:
        raise KeyError(content_id)
    lp = tracker.lesson_state(conn)
    pp, pc = snap["prog"]["practice_planned"], snap["prog"]["practice_credit"]
    modules = []
    for m in sorted((m for m in snap["cat"]["modules"].values() if m["content_id"] == content_id), key=lambda m: m["ord"]):
        lessons = [{**l, "completed_on": (lp.get(l["id"]) or {}).get("completed_on"),
                    "watched_min": (lp.get(l["id"]) or {}).get("watched_min", 0)}
                   for l in snap["cat"]["lessons"] if l["module_id"] == m["id"]]
        modules.append({**m, "lessons": lessons, "practice_planned": pp.get(m["id"], 0), "practice_done": min(pp.get(m["id"], 0), pc.get(m["id"], 0))})
    appearances = db.rows(conn, "SELECT * FROM appearances WHERE content_id=? ORDER BY position", (content_id,))
    planned = db.rows(conn, "SELECT date, kind, minutes FROM plan_items WHERE content_id=? ORDER BY date", (content_id,))
    sessions = db.rows(conn, "SELECT * FROM sessions WHERE target_id IN (SELECT id FROM lessons WHERE content_id=? UNION SELECT id FROM modules WHERE content_id=?) ORDER BY date DESC LIMIT 20", (content_id, content_id))
    stages = [{"id": s["id"], "title": s["title"], "status": s["effective_status"]} for s in snap["stages"] if s["unlock_after"] == content_id]
    from .domain import NATURES
    return {**c, "progress": snap["prog"]["per_content"][content_id], "modules": modules, "appearances": appearances,
            "confidence": db.loads(c.get("confidence"), {}), "practice_ratio_effective": tracker.practice_ratio(c, snap["cfg"]),
            "plan": {"first": planned[0]["date"] if planned else None, "last": planned[-1]["date"] if planned else None,
                     "minutes": sum(p["minutes"] for p in planned)},
            "sessions": sessions, "lab_stages": stages, "nature_info": NATURES.get(c["nature"], {})}


class LessonToggle(BaseModel):
    completed: bool
    date: Optional[date] = None


@app.post("/api/lessons/{lesson_id}/toggle")
def toggle_lesson(lesson_id: str, body: LessonToggle, conn: sqlite3.Connection = Depends(get_conn)):
    if not db.row(conn, "SELECT id FROM lessons WHERE id=?", (lesson_id,)):
        raise KeyError(lesson_id)
    before = _xp_state(conn)
    d = (body.date or config.today()).isoformat()
    if body.completed:
        conn.execute("INSERT INTO lesson_progress(lesson_id, completed_on) VALUES (?,?) ON CONFLICT(lesson_id) DO UPDATE SET completed_on=excluded.completed_on", (lesson_id, d))
    else:
        conn.execute("UPDATE lesson_progress SET completed_on=NULL WHERE lesson_id=?", (lesson_id,))
    return _reward(conn, before, "aula atualizada")


@app.post("/api/catalog/import")
def import_catalog(payload: dict, conn: sqlite3.Connection = Depends(get_conn)):
    cfg = settings_mod.load(conn)
    try:
        result = catalog_mod.import_catalog(conn, payload)
    except ValidationError as exc:
        raise HTTPException(422, detail=[{"loc": e["loc"], "msg": e["msg"]} for e in exc.errors()])
    db.set_meta(conn, "catalog_customized", "1")
    tracker.recalculate(conn, "catálogo importado")
    services.plan_summary(conn)
    return result


@app.get("/api/catalog/export")
def export_catalog_source():
    return FileResponse(config.catalog_path(), media_type="application/json", filename="catalog.json")


# ------------------------------------------------------------------- plano
@app.get("/api/plan/summary")
def plan_summary(conn: sqlite3.Connection = Depends(get_conn)):
    return services.plan_summary(conn)


@app.post("/api/plan/recalculate")
def plan_recalculate(conn: sqlite3.Connection = Depends(get_conn)):
    return tracker.recalculate(conn, "manual")


@app.get("/api/calendar")
def calendar(start: Optional[date] = None, end: Optional[date] = None, conn: sqlite3.Connection = Depends(get_conn)):
    t = config.today()
    start = start or t.replace(day=1)
    end = end or (start + timedelta(days=41))
    if end < start or (end - start).days > 400:
        raise ValueError("Intervalo inválido (máx. 400 dias).")
    return services.calendar(conn, start, end)


@app.get("/api/today")
def today(conn: sqlite3.Connection = Depends(get_conn)):
    tracker.ensure_plan_fresh(conn)
    return services.today_view(conn, services.snapshot(conn))


# ------------------------------------------------------------------- sessões
SessionType = Literal["VIDEO", "PRACTICE", "PROJECT", "REVIEW", "OTHER"]


class SessionIn(BaseModel):
    date: date
    type: SessionType
    target_kind: Literal["lesson", "module", "stage", "review", "content", "free"] = "free"
    target_id: Optional[str] = Field(default=None, max_length=200)
    title: str = Field(min_length=1, max_length=200)
    planned_min: float = Field(default=0, ge=0, le=720)
    actual_min: float = Field(ge=0, le=720)
    notes: str = Field(default="", max_length=4000)
    status: Literal["done", "partial", "missed"] = "done"
    focus: bool = False
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    complete_lessons: list[str] = []
    review_keys: list[str] = []

    @field_validator("title")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("título obrigatório")
        return v

    def check(self) -> None:
        if self.status != "missed" and self.actual_min <= 0:
            raise ValueError("Tempo realizado deve ser maior que zero.")
        if self.date > config.today() + timedelta(days=1):
            raise ValueError("Não é possível registrar sessões no futuro.")


def _apply_side_effects(conn: sqlite3.Connection, s: SessionIn) -> None:
    d = s.date.isoformat()
    if s.type == "VIDEO" and s.target_kind == "lesson" and s.target_id and s.target_id not in s.complete_lessons and s.status != "missed":
        conn.execute("INSERT INTO lesson_progress(lesson_id, watched_min) VALUES (?, ?) ON CONFLICT(lesson_id) DO UPDATE SET watched_min = watched_min + excluded.watched_min",
                     (s.target_id, s.actual_min))
        les = db.row(conn, "SELECT duration_min FROM lessons WHERE id=?", (s.target_id,))
        if les and les["duration_min"] and s.status == "done":
            w = db.row(conn, "SELECT watched_min FROM lesson_progress WHERE lesson_id=?", (s.target_id,))["watched_min"]
            if w >= les["duration_min"] * 0.95:
                conn.execute("UPDATE lesson_progress SET completed_on=COALESCE(completed_on, ?) WHERE lesson_id=?", (d, s.target_id))
    for lid in s.complete_lessons:
        if not db.row(conn, "SELECT id FROM lessons WHERE id=?", (lid,)):
            raise ValueError(f"Aula inexistente: {lid}")
        conn.execute("INSERT INTO lesson_progress(lesson_id, completed_on) VALUES (?,?) ON CONFLICT(lesson_id) DO UPDATE SET completed_on=COALESCE(lesson_progress.completed_on, excluded.completed_on)", (lid, d))
    for key in s.review_keys:
        try:
            learned, iv = key.split(":D")
            due = date.fromisoformat(learned) + timedelta(days=int(iv))
        except ValueError:
            raise ValueError(f"Chave de revisão inválida: {key}")
        conn.execute("INSERT OR IGNORE INTO review_log(review_key, learned_on, interval_days, due_on, done_on) VALUES (?,?,?,?,?)",
                     (key, learned, int(iv), due.isoformat(), d))


@app.get("/api/sessions")
def list_sessions(limit: int = 100, conn: sqlite3.Connection = Depends(get_conn)):
    limit = max(1, min(limit, 1000))
    rows = db.rows(conn, "SELECT * FROM sessions ORDER BY date DESC, id DESC LIMIT ?", (limit,))
    totals = db.rows(conn, "SELECT type, COUNT(*) AS n, SUM(actual_min) AS m FROM sessions WHERE status!='missed' GROUP BY type")
    return {"sessions": rows, "totals": totals}


@app.post("/api/sessions", status_code=201)
def create_session(body: SessionIn, conn: sqlite3.Connection = Depends(get_conn)):
    body.check()
    before = _xp_state(conn)
    cur = conn.execute(
        """INSERT INTO sessions(date, type, target_kind, target_id, title, planned_min, actual_min, notes, status, focus, started_at, ended_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
        (body.date.isoformat(), body.type, body.target_kind, body.target_id, body.title, body.planned_min, body.actual_min,
         body.notes, body.status, int(body.focus), body.started_at, body.ended_at))
    _apply_side_effects(conn, body)
    out = _reward(conn, before, f"sessão de {gamification.TYPE_PT[body.type].lower()}")
    return {"session": db.row(conn, "SELECT * FROM sessions WHERE id=?", (cur.lastrowid,)), **out}


class SessionPatch(BaseModel):
    actual_min: Optional[float] = Field(default=None, ge=0, le=720)
    notes: Optional[str] = Field(default=None, max_length=4000)
    status: Optional[Literal["done", "partial", "missed"]] = None
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)


@app.patch("/api/sessions/{sid}")
def patch_session(sid: int, body: SessionPatch, conn: sqlite3.Connection = Depends(get_conn)):
    if not db.row(conn, "SELECT id FROM sessions WHERE id=?", (sid,)):
        raise KeyError(sid)
    before = _xp_state(conn)
    for k, v in body.model_dump(exclude_none=True).items():
        conn.execute(f"UPDATE sessions SET {k}=? WHERE id=?", (v, sid))
    return {"session": db.row(conn, "SELECT * FROM sessions WHERE id=?", (sid,)), **_reward(conn, before, "sessão editada")}


@app.delete("/api/sessions/{sid}")
def delete_session(sid: int, conn: sqlite3.Connection = Depends(get_conn)):
    s = db.row(conn, "SELECT * FROM sessions WHERE id=?", (sid,))
    if not s:
        raise KeyError(sid)
    before = _xp_state(conn)
    conn.execute("DELETE FROM sessions WHERE id=?", (sid,))
    if s["type"] == "VIDEO" and s["target_kind"] == "lesson":
        conn.execute("UPDATE lesson_progress SET watched_min = MAX(0, watched_min - ?) WHERE lesson_id=?", (s["actual_min"], s["target_id"]))
    return _reward(conn, before, "sessão removida")


@app.post("/api/reviews/{key}/done")
def review_done(key: str, conn: sqlite3.Connection = Depends(get_conn)):
    before = _xp_state(conn)
    _apply_side_effects(conn, SessionIn(date=config.today(), type="REVIEW", title="Revisão", actual_min=1, review_keys=[key]))
    return _reward(conn, before, "revisão")


@app.get("/api/reviews")
def reviews(conn: sqlite3.Connection = Depends(get_conn)):
    snap = services.snapshot(conn)
    return {"reviews": snap["reviews"]}


# ------------------------------------------------------------------- lab
@app.get("/api/lab")
def get_lab(conn: sqlite3.Connection = Depends(get_conn)):
    snap = services.snapshot(conn)
    planned = {r["ref"]: r for r in db.rows(conn, "SELECT ref, MIN(date) AS first, MAX(date) AS last, SUM(minutes) AS m FROM plan_items WHERE kind='project' GROUP BY ref")}
    from .domain import COMPETENCIES
    labels = {c["id"]: c["label"] for c in COMPETENCIES}
    return {"stages": [{**s, "plan": planned.get(s["id"]), "competency_labels": [labels.get(c, c) for c in s["competencies"]]} for s in snap["stages"]]}


class StagePatch(BaseModel):
    status: Optional[Literal["locked", "available", "in_progress", "done"]] = None
    notes: Optional[str] = Field(default=None, max_length=20000)
    repo_url: Optional[str] = Field(default=None, max_length=500)


@app.patch("/api/lab/stages/{stage_id}")
def patch_stage(stage_id: str, body: StagePatch, conn: sqlite3.Connection = Depends(get_conn)):
    before = _xp_state(conn)
    lab.update_stage(conn, stage_id, body.model_dump(exclude_none=True), config.today().isoformat())
    return _reward(conn, before, "lab atualizado")


@app.post("/api/lab/tasks/{item_id}/toggle")
def toggle_task(item_id: int, conn: sqlite3.Connection = Depends(get_conn)):
    before = _xp_state(conn)
    lab.toggle(conn, "lab_tasks", item_id, config.today().isoformat())
    return _reward(conn, before, "tarefa do lab")


@app.post("/api/lab/milestones/{item_id}/toggle")
def toggle_milestone(item_id: int, conn: sqlite3.Connection = Depends(get_conn)):
    before = _xp_state(conn)
    lab.toggle(conn, "lab_milestones", item_id, config.today().isoformat())
    return _reward(conn, before, "milestone do lab")


# ------------------------------------------------------------------- gamificação e competências
@app.get("/api/gamification")
def get_gamification(conn: sqlite3.Connection = Depends(get_conn)):
    snap = services.snapshot(conn)
    return {**snap["game"], "streak": snap["streak"]}


@app.get("/api/competencies")
def get_competencies(conn: sqlite3.Connection = Depends(get_conn)):
    return {"competencies": services.snapshot(conn)["competencies"]}


# ------------------------------------------------------------------- ajustes e dados
@app.get("/api/settings")
def get_settings(conn: sqlite3.Connection = Depends(get_conn)):
    return settings_mod.load(conn)


class SettingsIn(BaseModel):
    start_date: Optional[date] = None
    rest_weekday: Optional[int] = Field(default=None, ge=0, le=6)
    project_weekday: Optional[int] = Field(default=None, ge=0, le=6)
    capacity: Optional[dict[str, int]] = None
    holidays: Optional[dict[str, float]] = None
    focus_minutes: Optional[int] = Field(default=None, ge=5, le=180)
    block_minutes: Optional[int] = Field(default=None, ge=20, le=90)
    practice_overrides: Optional[dict[str, float]] = None
    competency_baselines: Optional[dict[str, float]] = None

    @field_validator("practice_overrides")
    @classmethod
    def _pr(cls, v):
        if v is None:
            return v
        for k, x in v.items():
            if not 0 <= x <= 3:
                raise ValueError(f"razão de prática de {k} deve ficar entre 0 e 3 (0%–300%)")
        return v

    @field_validator("competency_baselines")
    @classmethod
    def _bl(cls, v):
        from .domain import COMPETENCY_IDS
        if v is None:
            return v
        for k, x in v.items():
            if k not in COMPETENCY_IDS:
                raise ValueError(f"competência desconhecida: {k}")
            if not 0 <= x <= 1:
                raise ValueError("ponto de partida entre 0 e 1")
        return v

    @field_validator("capacity")
    @classmethod
    def _cap(cls, v):
        if v is None:
            return v
        if set(v) != {str(i) for i in range(7)}:
            raise ValueError("capacity precisa das chaves 0..6")
        if any(not 0 <= m <= 480 for m in v.values()):
            raise ValueError("capacidade diária entre 0 e 480 min")
        if sum(1 for m in v.values() if m > 0) == 0:
            raise ValueError("ao menos um dia de estudo")
        return v

    @field_validator("holidays")
    @classmethod
    def _hol(cls, v):
        if v is None:
            return v
        for k, m in v.items():
            date.fromisoformat(k)
            if not 0 <= m <= 1:
                raise ValueError("multiplicador entre 0 e 1")
        return v


@app.put("/api/settings")
def put_settings(body: SettingsIn, conn: sqlite3.Connection = Depends(get_conn)):
    values = body.model_dump(exclude_none=True)
    if "start_date" in values:
        values["start_date"] = values["start_date"].isoformat()
    if body.rest_weekday is not None and body.capacity is None:
        cap = settings_mod.load(conn)["capacity"]
        values["capacity"] = cap
    cfg = settings_mod.save(conn, values)
    tracker.recalculate(conn, "ajustes alterados")
    summary = services.plan_summary(conn)
    return {"settings": cfg, "end": summary["end"]}


@app.get("/api/export")
def export(conn: sqlite3.Connection = Depends(get_conn)):
    data = backup_mod.export_json(conn)
    return Response(json.dumps(data, ensure_ascii=False, indent=2), media_type="application/json",
                    headers={"Content-Disposition": f'attachment; filename="study-tracker-export-{config.today()}.json"'})


@app.post("/api/import")
async def import_data(file: UploadFile = File(...), conn: sqlite3.Connection = Depends(get_conn)):
    raw = await file.read()
    if len(raw) > 20 * 1024 * 1024:
        raise ValueError("Arquivo muito grande (máx. 20 MB).")
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise ValueError("JSON inválido.")
    backup_mod.backup_to_file(label="antes-de-importar")
    counts = backup_mod.import_json(conn, data)
    tracker.recalculate(conn, "dados importados")
    return {"imported": counts}


@app.get("/api/backup")
def backup():
    path = backup_mod.backup_to_file()
    return FileResponse(path, media_type="application/octet-stream", filename=path.name)


@app.post("/api/restore")
async def restore(file: UploadFile = File(...)):
    raw = await file.read()
    if len(raw) > 200 * 1024 * 1024:
        raise ValueError("Arquivo muito grande.")
    safety = backup_mod.restore_from_bytes(raw)
    with db.session_scope() as conn:
        db.init_schema(conn)
        tracker.recalculate(conn, "backup restaurado")
    return {"restored": True, "safety_backup": safety.name}


# ------------------------------------------------------------------- PWA estático
@app.get("/sw.js", include_in_schema=False)
def service_worker():
    return FileResponse(config.FRONTEND_DIR / "sw.js", media_type="application/javascript",
                        headers={"Cache-Control": "no-cache", "Service-Worker-Allowed": "/"})


@app.get("/manifest.webmanifest", include_in_schema=False)
def manifest():
    return FileResponse(config.FRONTEND_DIR / "manifest.webmanifest", media_type="application/manifest+json")


app.mount("/", StaticFiles(directory=config.FRONTEND_DIR, html=True), name="frontend")
