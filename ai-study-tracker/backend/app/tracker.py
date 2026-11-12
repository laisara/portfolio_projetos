"""Estado real do aprendizado + recálculo adaptativo do plano.

Princípio: o histórico real (sessões, aulas concluídas, revisões feitas) nunca é apagado.
Apenas o planejamento de hoje em diante é recalculado.

Progresso compartilhado: o progresso é por AULA (id do curso + número). Como um curso repetido
tem um único cadastro, concluí-lo em uma trilha o conclui em todas, com seus módulos e aulas.
"""
from __future__ import annotations

import json
import sqlite3
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any

from . import config, db
from . import settings as settings_mod
from .planner import PlanResult, Review, Unit, build_plan, review_minutes


# ---------------------------------------------------------------- leitura base
def load_catalog(conn: sqlite3.Connection) -> dict[str, Any]:
    contents = {c["id"]: c for c in db.rows(conn, "SELECT * FROM contents ORDER BY study_ord")}
    for c in contents.values():
        c["competencies"] = db.loads(c["competencies"], [])
    modules = db.rows(conn, "SELECT * FROM modules ORDER BY content_id, ord")
    lessons = db.rows(conn, "SELECT * FROM lessons ORDER BY seq")
    return {"contents": contents, "modules": {m["id"]: m for m in modules}, "lessons": lessons}


def lesson_state(conn: sqlite3.Connection) -> dict[str, dict]:
    return {r["lesson_id"]: r for r in db.rows(conn, "SELECT * FROM lesson_progress")}


def is_required(lesson: dict) -> bool:
    """Aviso de conteúdo futuro ("em breve") não é aula e não bloqueia a conclusão do curso."""
    return lesson["kind"] != "placeholder"


def learned_minutes_by_day(conn: sqlite3.Connection, cat: dict) -> dict[str, float]:
    dur = {l["id"]: l["duration_min"] for l in cat["lessons"]}
    out: dict[str, float] = defaultdict(float)
    for lp in db.rows(conn, "SELECT lesson_id, completed_on FROM lesson_progress WHERE completed_on IS NOT NULL"):
        if lp["lesson_id"] in dur:
            out[lp["completed_on"]] += dur[lp["lesson_id"]]
    return dict(out)


def real_reviews(conn: sqlite3.Connection, cat: dict, cfg: dict, today: date) -> list[dict]:
    """Todas as revisões geradas pelo aprendizado real, com status."""
    rcfg = cfg["review"]
    log = {r["review_key"]: r for r in db.rows(conn, "SELECT * FROM review_log")}
    out = []
    for day, vmin in sorted(learned_minutes_by_day(conn, cat).items()):
        if vmin <= 0:
            continue
        learned = date.fromisoformat(day)
        for iv in rcfg["intervals"]:
            key = f"{day}:D{iv}"
            due = learned + timedelta(days=iv)
            grace = int(rcfg["grace"][str(iv)])
            done = log.get(key)
            if done:
                status = "done"
            elif today > due + timedelta(days=grace):
                status = "expired"
            elif today >= due:
                status = "due"
            else:
                status = "scheduled"
            out.append({"key": key, "learned_on": day, "interval": iv, "due": due.isoformat(),
                        "minutes": review_minutes(vmin, iv, rcfg), "status": status,
                        "done_on": done["done_on"] if done else None,
                        "on_time": bool(done) and date.fromisoformat(done["done_on"]) <= due + timedelta(days=1)})
    return out


# ---------------------------------------------------------------- plano
def make_units(cat: dict, lp: dict) -> list[Unit]:
    """Uma unidade de agenda por aula pendente, na ordem do catálogo (aula sem duração = 0 min)."""
    units: list[Unit] = []
    for l in cat["lessons"]:
        if not is_required(l):
            continue
        st = lp.get(l["id"])
        if st and st["completed_on"]:
            continue
        c = cat["contents"][l["content_id"]]
        if l["has_duration"]:
            remaining = max(0.01, round(l["duration_min"] - (st["watched_min"] if st else 0), 3))
        else:
            remaining = 0.0
        units.append(Unit(f"V:{l['id']}", "video", l["id"], l["title"], remaining, c["id"], "APRENDER",
                          {"lesson_id": l["id"], "module_id": l["module_id"], "course": c["title"],
                           "num": l["num"], "lesson_kind": l["kind"], "has_duration": bool(l["has_duration"])},
                          splittable=l["duration_min"] > 50))
    return units


def plan_inputs(conn: sqlite3.Connection, today: date) -> dict:
    cfg = settings_mod.load(conn)
    cat = load_catalog(conn)
    units = make_units(cat, lesson_state(conn))
    reviews = [Review(r["key"], date.fromisoformat(r["learned_on"]), r["interval"], date.fromisoformat(r["due"]),
                      r["minutes"], real=True)
               for r in real_reviews(conn, cat, cfg, today) if r["status"] in ("due", "scheduled")]
    done_today = db.row(conn, "SELECT COALESCE(SUM(actual_min),0) AS m FROM sessions WHERE date=? AND status!='missed'",
                        (today.isoformat(),))["m"]
    start = max(today, date.fromisoformat(cfg["start_date"]))
    return {"cfg": cfg, "cat": cat, "units": units, "reviews": reviews, "done_today": done_today, "start": start}


def pristine_plan(conn: sqlite3.Connection) -> PlanResult:
    """Plano original completo (sem progresso) — base do resumo de planejamento."""
    cfg = settings_mod.load(conn)
    cat = load_catalog(conn)
    return build_plan(start=date.fromisoformat(cfg["start_date"]), units=make_units(cat, {}), reviews=[], settings=cfg)


def recalculate(conn: sqlite3.Connection, reason: str = "manual") -> dict:
    today = config.today()
    inp = plan_inputs(conn, today)
    iso = today.isoformat()
    current = db.rows(conn, "SELECT kind, title, minutes, phase FROM plan_items WHERE date=? ORDER BY seq", (iso,))
    if current:  # "foto" do plano do dia, antes de reescrevê-lo
        conn.execute("INSERT OR IGNORE INTO day_baseline(date, planned_min, items) VALUES (?,?,?)",
                     (iso, sum(i["minutes"] for i in current), json.dumps(current, ensure_ascii=False)))
    result = build_plan(start=inp["start"], units=inp["units"], reviews=inp["reviews"], settings=inp["cfg"],
                        done_today_min=inp["done_today"], today=today)
    total = sum(result.totals.values())
    cur = conn.execute("INSERT INTO plan_revisions(generated_at, from_date, end_date, total_min, reason) VALUES (?,?,?,?,?)",
                       (datetime.now().isoformat(timespec="seconds"), iso,
                        result.end_date.isoformat() if result.end_date else None, total, reason))
    rev = cur.lastrowid
    conn.execute("DELETE FROM plan_items WHERE date >= ?", (iso,))
    for day in result.days:
        for seq, it in enumerate(day.items):
            conn.execute(
                "INSERT INTO plan_items(date, seq, kind, ref, title, minutes, content_id, phase, detail, rev) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (day.date.isoformat(), seq, it.kind, it.ref, it.title, it.minutes, it.content_id, it.phase,
                 json.dumps(it.detail, ensure_ascii=False), rev))
    db.set_meta(conn, "plan_generated_on", iso)
    return {"rev": rev, "end_date": result.end_date.isoformat() if result.end_date else None, "total_min": total}


def ensure_plan_fresh(conn: sqlite3.Connection) -> None:
    if db.get_meta(conn, "plan_generated_on") != config.today().isoformat():
        recalculate(conn, "novo dia")


# ---------------------------------------------------------------- progresso
def progress(conn: sqlite3.Connection) -> dict:
    cat = load_catalog(conn)
    lp = lesson_state(conn)
    per: dict[str, dict] = {cid: {"video_total": 0.0, "video_done": 0.0, "lessons": 0, "lessons_done": 0,
                                  "durationless": 0} for cid in cat["contents"]}
    per_module: dict[str, dict] = {mid: {"lessons": 0, "lessons_done": 0, "video_total": 0.0, "video_done": 0.0}
                                   for mid in cat["modules"]}
    for l in cat["lessons"]:
        if not is_required(l):
            continue
        pc, pm = per[l["content_id"]], per_module[l["module_id"]]
        st = lp.get(l["id"])
        done = bool(st and st["completed_on"])
        for p in (pc, pm):
            p["lessons"] += 1
            p["video_total"] += l["duration_min"]
            if done:
                p["lessons_done"] += 1
                p["video_done"] += l["duration_min"]
            elif st and l["duration_min"]:
                p["video_done"] += min(st["watched_min"], l["duration_min"] * 0.95)
        if not l["has_duration"]:
            pc["durationless"] += 1
    for pc in per.values():
        pc["complete"] = pc["lessons"] > 0 and pc["lessons_done"] == pc["lessons"]
        frac = pc["video_done"] / pc["video_total"] if pc["video_total"] else (pc["lessons_done"] / pc["lessons"] if pc["lessons"] else 0.0)
        pc["pct"] = 1.0 if pc["complete"] else min(0.99, frac)
    for pm in per_module.values():
        pm["complete"] = pm["lessons"] > 0 and pm["lessons_done"] == pm["lessons"]
    sums = {k: sum(pc[k] for pc in per.values()) for k in ("video_total", "video_done", "lessons", "lessons_done")}
    hours = {r["type"]: r["m"] for r in db.rows(conn, "SELECT type, SUM(actual_min) AS m FROM sessions WHERE status!='missed' GROUP BY type")}
    overall = sums["video_done"] / sums["video_total"] if sums["video_total"] else 0.0
    return {"per_content": per, "per_module": per_module, "overall": overall,
            "minutes_by_type": {t: hours.get(t, 0.0) for t in ("VIDEO", "PRACTICE", "PROJECT", "REVIEW", "OTHER")},
            **sums}


def streak(conn: sqlite3.Connection, cfg: dict, today: date) -> dict:
    days = {r["date"] for r in db.rows(conn, "SELECT DISTINCT date FROM sessions WHERE actual_min > 0 AND status!='missed'")}
    from .planner import day_capacity
    count, best, d = 0, 0, today
    if d.isoformat() not in days:
        d -= timedelta(days=1)
    while d >= today - timedelta(days=400):
        if d.isoformat() in days:
            count += 1
        elif day_capacity(d, cfg) > 0:
            break
        d -= timedelta(days=1)
    if days:
        run = 0
        d = date.fromisoformat(min(days))
        while d <= today:
            if d.isoformat() in days:
                run += 1
                best = max(best, run)
            elif day_capacity(d, cfg) > 0 and d != today:
                run = 0
            d += timedelta(days=1)
    return {"current": count, "best": max(best, count)}
