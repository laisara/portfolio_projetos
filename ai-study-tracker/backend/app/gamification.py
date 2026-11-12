"""XP, níveis, conquistas e mapa de competências (tudo derivado dos dados reais de estudo)."""
from __future__ import annotations

import sqlite3
from datetime import date

from . import db
from . import domain as D

TYPE_PT = {"VIDEO": "Aula", "PRACTICE": "Prática", "PROJECT": "Projeto", "REVIEW": "Revisão", "OTHER": "Outro"}


def _session_xp(s: dict) -> float:
    if s["status"] == "missed":
        return 0.0
    return round(min(s["actual_min"], D.XP_SESSION_CAP_MIN) * D.XP_PER_MIN.get(s["type"], 0.5))


ACHIEVEMENTS = [
    # id, título, descrição, xp, ícone, condição(stats)
    ("first_session", "Primeiro passo", "Registrar a primeira sessão de estudo.", 25, "play", lambda s: s["sessions"] >= 1),
    ("first_build", "Mãos na massa", "Registrar uma sessão de prática ou projeto.", 50, "hammer", lambda s: s["build_sessions"] >= 1),
    ("focus_5", "Foco profundo", "5 sessões no Focus Mode com 25+ min.", 75, "timer", lambda s: s["focus_25"] >= 5),
    ("streak_3", "Ritmo", "3 dias de estudo seguidos (descanso não quebra).", 50, "flame", lambda s: s["best_streak"] >= 3),
    ("streak_7", "Consistência", "7 dias de estudo seguidos.", 120, "flame", lambda s: s["best_streak"] >= 7),
    ("streak_21", "Hábito formado", "21 dias de estudo seguidos.", 300, "flame", lambda s: s["best_streak"] >= 21),
    ("hours_10", "10 horas", "10h de estudo registradas.", 60, "clock", lambda s: s["total_min"] >= 600),
    ("hours_50", "50 horas", "50h de estudo registradas.", 200, "clock", lambda s: s["total_min"] >= 3000),
    ("hours_100", "Centena", "100h de estudo registradas.", 400, "clock", lambda s: s["total_min"] >= 6000),
    ("reviews_10", "Memória longa", "10 revisões espaçadas concluídas.", 80, "repeat", lambda s: s["reviews_done"] >= 10),
    ("reviews_ontime_20", "Revisora pontual", "20 revisões feitas no prazo.", 150, "repeat", lambda s: s["reviews_on_time"] >= 20),
    ("first_course", "Curso concluído", "Concluir todas as aulas de um curso.", 100, "book-open", lambda s: s["contents_done"] >= 1),
    ("ten_courses", "Dez cursos", "Concluir 10 cursos.", 250, "layers", lambda s: s["contents_done"] >= 10),
    ("first_track", "Trilha concluída", "Concluir todos os cursos de uma trilha.", 300, "route", lambda s: s["tracks_done"] >= 1),
    ("half_formation", "Metade do caminho", "Concluir metade do conteúdo da formação.", 400, "target", lambda s: s["overall"] >= 0.5),
    ("doer", "Fazer > Assistir", "Prática + projeto registrados maiores que o tempo de aula (mín. 5h de aula).", 250, "zap",
     lambda s: s["video_min"] >= 300 and s["build_min"] > s["video_min"]),
    ("formation_done", "Formação concluída", "Concluir todos os cursos da formação.", 1000, "trophy", lambda s: s["overall"] >= 0.9999),
]


def compute(conn: sqlite3.Connection, prog: dict, reviews: list[dict], streak: dict, tracks: list[dict], today: date) -> dict:
    sessions = db.rows(conn, "SELECT * FROM sessions ORDER BY date, id")
    ledger: list[dict] = []
    for s in sessions:
        xp = _session_xp(s)
        if xp:
            ledger.append({"date": s["date"], "xp": xp, "label": f"{TYPE_PT.get(s['type'], s['type'])} · {s['title']}", "kind": s["type"]})
    titles = {l["id"]: l["title"] for l in db.rows(conn, "SELECT id, title FROM lessons")}
    for l in db.rows(conn, "SELECT lesson_id, completed_on FROM lesson_progress WHERE completed_on IS NOT NULL"):
        if l["lesson_id"] in titles:
            ledger.append({"date": l["completed_on"], "xp": D.XP_LESSON, "label": f"Aula concluída · {titles[l['lesson_id']]}", "kind": "LESSON"})
    for r in reviews:
        if r["status"] == "done":
            ledger.append({"date": r["done_on"], "xp": D.XP_REVIEW_ON_TIME if r["on_time"] else D.XP_REVIEW_LATE,
                           "label": f"Revisão D+{r['interval']} ({'no prazo' if r['on_time'] else 'atrasada'})", "kind": "REVIEW_DONE"})
    contents_done = [cid for cid, pc in prog["per_content"].items() if pc["complete"] and not pc["optional"]]
    for cid in contents_done:
        ledger.append({"date": None, "xp": D.XP_CONTENT_DONE, "label": f"Curso concluído · {cid}", "kind": "CONTENT"})
    tracks_done = [t for t in tracks if t["complete"]]
    for t in tracks_done:
        ledger.append({"date": None, "xp": D.XP_TRACK_DONE, "label": f"Trilha concluída · {t['title']}", "kind": "TRACK"})

    mt = prog["minutes_by_type"]
    stats = {
        "sessions": len([s for s in sessions if s["status"] != "missed"]),
        "build_sessions": len([s for s in sessions if s["type"] in ("PRACTICE", "PROJECT") and s["status"] != "missed"]),
        "focus_25": len([s for s in sessions if s["focus"] and s["actual_min"] >= 25]),
        "best_streak": streak["best"], "total_min": sum(mt.values()),
        "video_min": mt["VIDEO"], "build_min": mt["PRACTICE"] + mt["PROJECT"],
        "reviews_done": len([r for r in reviews if r["status"] == "done"]),
        "reviews_on_time": len([r for r in reviews if r["status"] == "done" and r["on_time"]]),
        "contents_done": len(contents_done), "tracks_done": len(tracks_done), "overall": prog["overall"],
    }
    stored = {r["id"]: r["unlocked_on"] for r in db.rows(conn, "SELECT * FROM achievements_unlocked")}
    achievements = []
    for aid, title, desc, xp, icon, cond in ACHIEVEMENTS:
        ok = bool(cond(stats))
        if ok and aid not in stored:
            conn.execute("INSERT INTO achievements_unlocked(id, unlocked_on) VALUES (?,?)", (aid, today.isoformat()))
            stored[aid] = today.isoformat()
        elif not ok and aid in stored:
            conn.execute("DELETE FROM achievements_unlocked WHERE id=?", (aid,))
            stored.pop(aid)
        if ok:
            ledger.append({"date": stored[aid], "xp": xp, "label": f"Conquista · {title}", "kind": "ACHIEVEMENT"})
        achievements.append({"id": aid, "title": title, "description": desc, "xp": xp, "icon": icon,
                             "unlocked": ok, "unlocked_on": stored.get(aid)})

    total = int(sum(e["xp"] for e in ledger))
    level = D.LEVELS[0]
    for lv in D.LEVELS:
        if total >= lv["xp"]:
            level = lv
    nxt = next((lv for lv in D.LEVELS if lv["xp"] > total), None)
    pct = 1.0 if not nxt else (total - level["xp"]) / (nxt["xp"] - level["xp"])
    ledger.sort(key=lambda e: (e["date"] or "0000"), reverse=True)
    by_kind: dict[str, int] = {}
    for e in ledger:
        by_kind[e["kind"]] = by_kind.get(e["kind"], 0) + int(e["xp"])
    return {"xp": total, "level": level, "next_level": nxt, "level_pct": pct, "levels": D.LEVELS,
            "achievements": achievements, "ledger": ledger[:60], "xp_by_kind": by_kind, "stats": stats,
            "rules": {"per_min": D.XP_PER_MIN, "lesson": D.XP_LESSON, "review_on_time": D.XP_REVIEW_ON_TIME,
                      "review_late": D.XP_REVIEW_LATE, "content": D.XP_CONTENT_DONE, "track": D.XP_TRACK_DONE}}


def competencies(prog: dict, contents: dict, reviews: list[dict], learned: dict[str, set], baselines: dict | None = None) -> list[dict]:
    """Nível = ponto de partida (estimado, editável) + evolução por cursos concluídos e revisões em dia.
    learned: data → conteúdos estudados naquele dia (base das revisões)."""
    out = []
    for comp in D.COMPETENCIES:
        cids = [cid for cid, c in contents.items() if comp["id"] in c["competencies"] and not c["optional"]]
        vt = sum(prog["per_content"][c]["video_total"] for c in cids)
        vd = sum(prog["per_content"][c]["video_done"] for c in cids)
        parts: dict[str, float] = {}
        if vt:
            parts["content"] = vd / vt
            days = {d for d, cs in learned.items() if cs & set(cids)}
            rv = [r for r in reviews if r["learned_on"] in days]
            parts["review"] = (len([r for r in rv if r["status"] == "done"]) / len(rv)) * (vd / vt) if rv else 0.0
        wsum = sum(D.COMPETENCY_WEIGHTS[k] for k in parts) or 1
        score = sum(D.COMPETENCY_WEIGHTS[k] * v for k, v in parts.items()) / wsum
        base = float((baselines or {}).get(comp["id"], comp["baseline"]))
        out.append({**comp, "baseline": base, "baseline_default": comp["baseline"], "level": base + (1 - base) * score,
                    "score": score, "parts": parts, "courses": [contents[c]["title"] for c in cids],
                    "courses_done": len([c for c in cids if prog["per_content"][c]["complete"]]), "courses_total": len(cids)})
    return out
