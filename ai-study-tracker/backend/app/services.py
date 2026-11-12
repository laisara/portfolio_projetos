"""Agregações para as telas (dashboard, trilhas, calendário, planejamento)."""
from __future__ import annotations

import json
import sqlite3
from collections import defaultdict
from datetime import date, timedelta

from . import catalog as catalog_mod
from . import config, db, gamification, lab, tracker
from . import settings as settings_mod
from .domain import WEEKDAYS_PT
from .planner import day_capacity


def snapshot(conn: sqlite3.Connection) -> dict:
    """Estado completo derivado (uma passada pelo banco)."""
    today = config.today()
    cfg = settings_mod.load(conn)
    cat = tracker.load_catalog(conn)
    prog = tracker.progress(conn)
    reviews = tracker.real_reviews(conn, cat, cfg, today)
    stages = lab.stages(conn, prog, cat["contents"])
    stk = tracker.streak(conn, cfg, today)
    game = gamification.compute(conn, prog, reviews, stages, stk, today)
    les_content = {l["id"]: l["content_id"] for l in cat["lessons"]}
    learned: dict[str, set] = defaultdict(set)
    for r in db.rows(conn, "SELECT lesson_id, completed_on FROM lesson_progress WHERE completed_on IS NOT NULL"):
        if r["lesson_id"] in les_content:
            learned[r["completed_on"]].add(les_content[r["lesson_id"]])
    comps = gamification.competencies(prog, cat["contents"], stages, reviews, learned, cfg.get("competency_baselines") or {})
    return {"today": today, "cfg": cfg, "cat": cat, "prog": prog, "reviews": reviews, "stages": stages,
            "streak": stk, "game": game, "competencies": comps}


def tracks_progress(conn: sqlite3.Connection, snap: dict) -> list[dict]:
    """8 trilhas declaradas. Sem associação confirmada pelos prints → "A confirmar" (nada é inventado)."""
    prog, contents = snap["prog"], snap["cat"]["contents"]
    out = []
    for t in db.rows(conn, "SELECT * FROM tracks ORDER BY ord"):
        cids = sorted({a["content_id"] for a in db.rows(conn, "SELECT content_id FROM appearances WHERE track_id=?", (t["id"],))})
        pcs = [prog["per_content"][c] for c in cids]
        tot = sum(p["video_total"] + p["practice_total"] for p in pcs)
        done = sum(p["video_done"] + p["practice_done"] for p in pcs)
        out.append({**t, "to_confirm": not t["confirmed"] and not cids, "pct": done / tot if tot else 0.0,
                    "video_total": sum(p["video_total"] for p in pcs), "lessons": sum(p["lessons"] for p in pcs),
                    "lessons_done": sum(p["lessons_done"] for p in pcs),
                    "courses": [{"id": c, "title": contents[c]["title"], "duration_min": contents[c]["duration_min"],
                                 "pct": prog["per_content"][c]["pct"]} for c in cids]})
    return out


def _items_for(conn, iso: str) -> list[dict]:
    items = db.rows(conn, "SELECT * FROM plan_items WHERE date=? ORDER BY seq", (iso,))
    for i in items:
        i["detail"] = db.loads(i["detail"], {})
    return items


def today_view(conn: sqlite3.Connection, snap: dict) -> dict:
    today = snap["today"]
    iso = today.isoformat()
    items = _items_for(conn, iso)
    sessions = db.rows(conn, "SELECT * FROM sessions WHERE date=? ORDER BY id", (iso,))
    next_day = None
    if not items:
        r = db.row(conn, "SELECT MIN(date) AS d FROM plan_items WHERE date > ?", (iso,))
        if r and r["d"]:
            next_day = {"date": r["d"], "weekday": WEEKDAYS_PT[date.fromisoformat(r["d"]).weekday()], "items": _items_for(conn, r["d"])}
    cap = day_capacity(today, snap["cfg"])
    return {"date": iso, "weekday": WEEKDAYS_PT[today.weekday()], "capacity": cap, "rest": cap == 0,
            "items": items, "sessions": sessions, "next_day": next_day,
            "done_min": sum(s["actual_min"] for s in sessions if s["status"] != "missed")}


def dashboard(conn: sqlite3.Connection) -> dict:
    tracker.ensure_plan_fresh(conn)
    snap = snapshot(conn)
    snap["_today_items"] = _items_for(conn, snap["today"].isoformat())
    prog, game = snap["prog"], snap["game"]
    end = db.row(conn, "SELECT MAX(date) AS d FROM plan_items")["d"]
    pristine_end = db.get_meta(conn, "pristine_end")
    upcoming = [r for r in snap["reviews"] if r["status"] in ("due", "scheduled")][:6]
    upcoming_planned = []
    for it in db.rows(conn, "SELECT date, detail FROM plan_items WHERE kind='review' AND date>=? ORDER BY date LIMIT 6", (snap["today"].isoformat(),)):
        for r in db.loads(it["detail"], {}).get("reviews", []):
            upcoming_planned.append({**r, "planned_for": it["date"]})
    nxt_stage = next((s for s in snap["stages"] if s["effective_status"] in ("in_progress", "available")), None) \
        or next((s for s in snap["stages"] if s["effective_status"] == "locked"), None)
    ana = catalog_mod.analysis(conn)
    pristine = tracker.pristine_plan(conn).totals
    mt = prog["minutes_by_type"]
    planned = {"formation": pristine["video"], "practice": pristine["practice"], "project": pristine["project"], "review": pristine["review"]}
    load = {"planned": {**planned, "total": sum(planned.values())},
            "done": {"formation": mt["VIDEO"], "practice": mt["PRACTICE"], "project": mt["PROJECT"], "review": mt["REVIEW"],
                     "total": sum(mt.values())}}
    iso = snap["today"].isoformat()
    todays = [r for it in snap["_today_items"] if it["kind"] == "review" for r in it["detail"].get("reviews", [])]
    done_today = db.row(conn, "SELECT COUNT(*) AS n FROM review_log WHERE done_on=?", (iso,))["n"]
    reviews_today = {"pending": len(todays), "done": done_today, "total": len(todays) + done_today}
    return {
        "today": today_view(conn, snap),
        "overall": prog["overall"],
        "content_pct": (prog["video_done"] + prog["practice_done"]) / ((prog["video_total"] + prog["practice_total"]) or 1),
        "video": {"done": prog["video_done"], "total": prog["video_total"]},
        "practice": {"done": prog["practice_done"], "total": prog["practice_total"]},
        "project": {"done": prog["project_done"], "total": prog["project_total"]},
        "minutes_by_type": prog["minutes_by_type"],
        "lessons": {"done": prog["lessons_done"], "total": prog["lessons"]},
        "xp": game["xp"], "level": game["level"], "next_level": game["next_level"], "level_pct": game["level_pct"],
        "streak": snap["streak"],
        "upcoming_reviews": upcoming_planned[:6] or upcoming,
        "reviews_due": len([r for r in snap["reviews"] if r["status"] == "due"]),
        "tracks": tracks_progress(conn, snap),
        "plan_end": end, "pristine_end": pristine_end,
        "next_stage": {"id": nxt_stage["id"], "title": nxt_stage["title"], "status": nxt_stage["effective_status"],
                       "pct": nxt_stage["pct"], "unlock_title": nxt_stage["unlock_title"]} if nxt_stage else None,
        "catalog": {k: ana[k] for k in ("declared_min", "identified_gross_min", "duplicate_min", "identified_unique_min",
                                        "unidentified_min", "identified_pct", "tracks_confirmed", "tracks_total")},
        "load": load,
        "reviews_today": reviews_today,
    }


def calendar(conn: sqlite3.Connection, start: date, end: date) -> dict:
    tracker.ensure_plan_fresh(conn)
    cfg = settings_mod.load(conn)
    today = config.today()
    plan = defaultdict(list)
    for it in db.rows(conn, "SELECT date, kind, title, minutes, phase, content_id, ref, detail FROM plan_items WHERE date BETWEEN ? AND ? ORDER BY date, seq",
                      (start.isoformat(), end.isoformat())):
        it["detail"] = db.loads(it["detail"], {})
        plan[it["date"]].append(it)
    baseline = {r["date"]: json.loads(r["items"]) for r in db.rows(conn, "SELECT * FROM day_baseline WHERE date BETWEEN ? AND ?", (start.isoformat(), end.isoformat()))}
    actual = defaultdict(list)
    for s in db.rows(conn, "SELECT * FROM sessions WHERE date BETWEEN ? AND ? ORDER BY id", (start.isoformat(), end.isoformat())):
        actual[s["date"]].append(s)
    plan_start = cfg["start_date"]
    plan_end = db.row(conn, "SELECT MAX(date) AS d FROM plan_items")["d"]
    days = []
    d = start
    while d <= end:
        iso = d.isoformat()
        items = plan.get(iso, [])
        if d < today and iso in baseline:
            items = baseline[iso]
        by_kind = defaultdict(float)
        for i in items:
            by_kind[i["kind"]] += i["minutes"]
        act = defaultdict(float)
        for s in actual.get(iso, []):
            if s["status"] != "missed":
                act[s["type"]] += s["actual_min"]
        cap = day_capacity(d, cfg)
        in_range = plan_start <= iso <= (plan_end or plan_start)
        days.append({"date": iso, "weekday": d.weekday(), "capacity": cap, "rest": cap == 0 and in_range,
                     "holiday": iso in cfg["holidays"], "in_plan": in_range, "past": d < today, "is_today": d == today,
                     "items": items, "planned": dict(by_kind), "planned_total": sum(by_kind.values()),
                     "actual": dict(act), "actual_total": sum(act.values()),
                     "sessions": actual.get(iso, [])})
        d += timedelta(days=1)
    return {"start": start.isoformat(), "end": end.isoformat(), "today": today.isoformat(),
            "plan_start": plan_start, "plan_end": plan_end, "days": days}


def plan_summary(conn: sqlite3.Connection) -> dict:
    tracker.ensure_plan_fresh(conn)
    res = tracker.pristine_plan(conn)
    cfg = settings_mod.load(conn)
    ana = catalog_mod.analysis(conn)
    study = [d for d in res.days if d.items]
    rest = [d for d in res.days if not d.items]
    total = sum(res.totals.values())
    weeks = defaultdict(lambda: defaultdict(float))
    for d in res.days:
        wk = (d.date - timedelta(days=d.date.weekday())).isoformat()
        for i in d.items:
            weeks[wk][i.kind] += i.minutes
    by_wd = defaultdict(list)
    for d in study:
        by_wd[d.date.weekday()].append(d.total)
    db.set_meta(conn, "pristine_end", res.end_date.isoformat() if res.end_date else "")
    revs = db.rows(conn, "SELECT * FROM plan_revisions ORDER BY rev DESC LIMIT 12")
    current_end = db.row(conn, "SELECT MAX(date) AS d FROM plan_items")["d"]
    return {
        "catalog": ana,
        "totals": res.totals, "total_min": total,
        "start": cfg["start_date"], "end": res.end_date.isoformat() if res.end_date else None,
        "current_end": current_end,
        "study_days": len(study), "rest_days": len(rest),
        "calendar_days": len(res.days),
        "avg_per_study_day": total / len(study) if study else 0,
        "max_day": max((d.total for d in study), default=0),
        "avg_by_weekday": {WEEKDAYS_PT[k]: sum(v) / len(v) for k, v in sorted(by_wd.items())},
        "weeks": [{"week": k, **v, "total": sum(v.values())} for k, v in sorted(weeks.items())],
        "doing_ratio": (res.totals["practice"] + res.totals["project"]) / res.totals["video"] if res.totals["video"] else 0,
        "settings": cfg,
        "revisions": revs,
    }
