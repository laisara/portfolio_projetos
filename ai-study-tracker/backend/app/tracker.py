"""Estado real do aprendizado + recálculo adaptativo do plano.

Princípio: o histórico real (sessões, aulas concluídas, revisões feitas) nunca é
apagado. Apenas o planejamento de hoje em diante é recalculado.
"""
from __future__ import annotations

import json
import math
import sqlite3
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any

from . import config, db
from . import settings as settings_mod
from .domain import NATURES
from .planner import PlanResult, Review, Stage, Unit, build_plan, review_minutes, round5


# ---------------------------------------------------------------- leitura base
def load_catalog(conn: sqlite3.Connection) -> dict[str, Any]:
    contents = {c["id"]: c for c in db.rows(conn, "SELECT * FROM contents ORDER BY study_ord")}
    for c in contents.values():
        c["competencies"] = db.loads(c["competencies"], [])
    modules = db.rows(conn, "SELECT * FROM modules")
    lessons = db.rows(conn, "SELECT * FROM lessons ORDER BY seq")
    return {"contents": contents, "modules": {m["id"]: m for m in modules}, "lessons": lessons}


def practice_ratio(content: dict, cfg: dict) -> float:
    """Estimativa de prática/vídeo: override do usuário > padrão do catálogo."""
    ov = (cfg.get("practice_overrides") or {}).get(content["id"])
    return float(content["practice_ratio"] if ov is None else ov)


def practice_planned(cat: dict, cfg: dict) -> dict[str, float]:
    """Minutos de prática ESTIMADOS por módulo (≠ duração real das aulas)."""
    by_module: dict[str, float] = defaultdict(float)
    for l in cat["lessons"]:
        by_module[l["module_id"]] += l["duration_min"]
    out = {}
    for mid, vid in by_module.items():
        ratio = practice_ratio(cat["contents"][cat["modules"][mid]["content_id"]], cfg)
        out[mid] = max(10.0, round5(vid * ratio)) if ratio > 0 else 0.0
    return out


def lesson_state(conn: sqlite3.Connection) -> dict[str, dict]:
    return {r["lesson_id"]: r for r in db.rows(conn, "SELECT * FROM lesson_progress")}


def session_credit(conn: sqlite3.Connection, type_: str, kind: str) -> dict[str, float]:
    return {r["target_id"]: r["m"] for r in db.rows(
        conn, "SELECT target_id, SUM(actual_min) AS m FROM sessions WHERE type=? AND target_kind=? AND status!='missed' GROUP BY target_id",
        (type_, kind))}


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
def make_units(cat: dict, cfg: dict, lp: dict, credit: dict[str, float]) -> list[Unit]:
    """Unidades de agenda a partir do catálogo REAL e do progresso.

    - Curso com aulas identificadas: cada aula + a prática do módulo.
    - Curso sem lista de aulas (hoje, todos): o curso é uma unidade só; o PLANO o divide em
      sessões de vídeo de até `block_minutes`, cada uma seguida da sua prática. Essas sessões
      existem só no cronograma e são recalculadas — não fazem parte do catálogo.
    """
    block = float(cfg.get("block_minutes", 45))
    pp = practice_planned(cat, cfg)
    mod_lessons: dict[str, list[dict]] = defaultdict(list)
    order: list[str] = []
    for l in cat["lessons"]:
        if l["module_id"] not in mod_lessons:
            order.append(l["module_id"])
        mod_lessons[l["module_id"]].append(l)
    units: list[Unit] = []
    for mid in order:
        m = cat["modules"][mid]
        c = cat["contents"][m["content_id"]]
        nat = NATURES.get(c["nature"], NATURES["ferramenta"])
        prac_rem = max(0.0, pp.get(mid, 0) - credit.get(mid, 0))
        course_level = all(l["segment"] for l in mod_lessons[mid])
        if course_level:
            l = mod_lessons[mid][0]
            st = lp.get(l["id"])
            if st and st["completed_on"]:
                continue
            rem = max(5.0, l["duration_min"] - (st["watched_min"] if st else 0))
            n = max(1, math.ceil(rem / block - 0.05))
            vid = [round(rem / n)] * n
            vid[-1] = round(rem - sum(vid[:-1]))
            pr = [round5(prac_rem / n)] * n if prac_rem >= 5 else [0.0] * n
            if prac_rem >= 5:
                pr[-1] = max(0.0, round5(prac_rem - sum(pr[:-1])))
            for i in range(n):
                title = c["title"] + (f" · sessão {i + 1}/{n}" if n > 1 else "")
                units.append(Unit(f"V:{l['id']}:{i}", "video", l["id"], title, float(vid[i]), c["id"], "APRENDER",
                                  {"lesson_id": l["id"], "module_id": mid, "course": c["title"], "block": i + 1, "of": n,
                                   "course_level": True}))
                if pr[i] >= 5:
                    units.append(Unit(f"P:{mid}:{i}", "practice", mid, f"Prática · {c['title']}" + (f" · {i + 1}/{n}" if n > 1 else ""),
                                      float(pr[i]), c["id"], nat["phase"],
                                      {"module_id": mid, "course": c["title"], "action": nat["action"], "block": i + 1, "of": n}, splittable=True))
            continue
        for l in mod_lessons[mid]:
            st = lp.get(l["id"])
            if st and st["completed_on"]:
                continue
            remaining = max(5.0, l["duration_min"] - (st["watched_min"] if st else 0))
            units.append(Unit(f"V:{l['id']}", "video", l["id"], l["title"], remaining, c["id"], "APRENDER",
                              {"lesson_id": l["id"], "module_id": mid, "course": c["title"]},
                              splittable=l["duration_min"] > 50))
        if prac_rem >= 5:
            units.append(Unit(f"P:{mid}", "practice", mid, f"Prática · {c['title']} · {m['title']}", round5(prac_rem) or 5.0,
                              c["id"], nat["phase"], {"module_id": mid, "course": c["title"], "action": nat["action"]}, splittable=True))
    return units


def make_stages(conn: sqlite3.Connection, cat: dict, stage_credit: dict[str, float], pristine: bool = False) -> list[Stage]:
    stages = []
    for s in db.rows(conn, "SELECT * FROM lab_stages ORDER BY ord"):
        rem = s["planned_hours"] * 60 if pristine else (0.0 if s["status"] == "done" else max(0.0, s["planned_hours"] * 60 - stage_credit.get(s["id"], 0)))
        unlock = s["unlock_after"] if s["unlock_after"] in cat["contents"] else None
        stages.append(Stage(s["id"], f"AI Agent Lab · {s['title']}", round5(rem), unlock))
    return stages


def plan_inputs(conn: sqlite3.Connection, today: date) -> dict:
    cfg = settings_mod.load(conn)
    cat = load_catalog(conn)
    units = make_units(cat, cfg, lesson_state(conn), session_credit(conn, "PRACTICE", "module"))
    stages = make_stages(conn, cat, session_credit(conn, "PROJECT", "stage"))
    reviews = [Review(r["key"], date.fromisoformat(r["learned_on"]), r["interval"], date.fromisoformat(r["due"]),
                      r["minutes"], real=True)
               for r in real_reviews(conn, cat, cfg, today) if r["status"] in ("due", "scheduled")]
    done_today = db.row(conn, "SELECT COALESCE(SUM(actual_min),0) AS m FROM sessions WHERE date=? AND status!='missed'",
                        (today.isoformat(),))["m"]
    start = max(today, date.fromisoformat(cfg["start_date"]))
    return {"cfg": cfg, "cat": cat, "units": units, "stages": stages, "reviews": reviews,
            "done_today": done_today, "start": start}


def pristine_plan(conn: sqlite3.Connection) -> PlanResult:
    """Plano original completo (sem progresso) — base do resumo de planejamento."""
    cfg = settings_mod.load(conn)
    cat = load_catalog(conn)
    return build_plan(start=date.fromisoformat(cfg["start_date"]), units=make_units(cat, cfg, {}, {}),
                      stages=make_stages(conn, cat, {}, pristine=True), reviews=[], settings=cfg)


def recalculate(conn: sqlite3.Connection, reason: str = "manual") -> dict:
    today = config.today()
    inp = plan_inputs(conn, today)
    iso = today.isoformat()
    # preserva a "foto" do dia antes de reescrevê-lo
    current = db.rows(conn, "SELECT kind, title, minutes, phase FROM plan_items WHERE date=? ORDER BY seq", (iso,))
    if current:
        conn.execute("INSERT OR IGNORE INTO day_baseline(date, planned_min, items) VALUES (?,?,?)",
                     (iso, sum(i["minutes"] for i in current), json.dumps(current, ensure_ascii=False)))
    result = build_plan(start=inp["start"], units=inp["units"], stages=inp["stages"], reviews=inp["reviews"],
                        settings=inp["cfg"], done_today_min=inp["done_today"], today=today)
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
    pp = practice_planned(cat, settings_mod.load(conn))
    pcredit = session_credit(conn, "PRACTICE", "module")
    scredit = session_credit(conn, "PROJECT", "stage")
    stages = db.rows(conn, "SELECT * FROM lab_stages ORDER BY ord")

    per_content: dict[str, dict] = {}
    for cid, c in cat["contents"].items():
        per_content[cid] = {"video_total": 0.0, "video_done": 0.0, "lessons": 0, "lessons_done": 0,
                            "practice_total": 0.0, "practice_done": 0.0}
    for l in cat["lessons"]:
        pc = per_content[l["content_id"]]
        pc["video_total"] += l["duration_min"]
        pc["lessons"] += 1
        st = lp.get(l["id"])
        if st and st["completed_on"]:
            pc["video_done"] += l["duration_min"]
            pc["lessons_done"] += 1
        elif st:
            pc["video_done"] += min(st["watched_min"], l["duration_min"] * 0.95)
    for mid, planned in pp.items():
        pc = per_content[cat["modules"][mid]["content_id"]]
        pc["practice_total"] += planned
        pc["practice_done"] += min(planned, pcredit.get(mid, 0))
    for pc in per_content.values():
        tot = pc["video_total"] + pc["practice_total"]
        pc["pct"] = (pc["video_done"] + pc["practice_done"]) / tot if tot else 0.0
        pc["complete"] = pc["lessons"] > 0 and pc["lessons_done"] == pc["lessons"] and pc["practice_done"] >= pc["practice_total"] - 0.5

    proj_total = sum(s["planned_hours"] * 60 for s in stages)
    proj_done = sum(s["planned_hours"] * 60 if s["status"] == "done" else min(s["planned_hours"] * 60, scredit.get(s["id"], 0))
                    for s in stages)
    sums = {k: sum(pc[k] for pc in per_content.values())
            for k in ("video_total", "video_done", "practice_total", "practice_done", "lessons", "lessons_done")}
    hours = {r["type"]: r["m"] for r in db.rows(conn, "SELECT type, SUM(actual_min) AS m FROM sessions WHERE status!='missed' GROUP BY type")}
    denom = sums["video_total"] + sums["practice_total"] + proj_total
    overall = (sums["video_done"] + sums["practice_done"] + proj_done) / denom if denom else 0.0
    return {"per_content": per_content, "overall": overall, "project_total": proj_total, "project_done": proj_done,
            "project_credit": scredit, "practice_planned": pp, "practice_credit": pcredit,
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
    # melhor sequência
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
