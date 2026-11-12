"""XP, níveis, conquistas e mapa de competências (tudo derivado dos dados reais)."""
from __future__ import annotations

import sqlite3
from datetime import date

from . import db
from . import domain as D


TYPE_PT = {"VIDEO": "Vídeo", "PRACTICE": "Prática", "PROJECT": "Projeto", "REVIEW": "Revisão", "OTHER": "Outro"}


def _session_xp(s: dict) -> float:
    if s["status"] == "missed":
        return 0.0
    return round(min(s["actual_min"], D.XP_SESSION_CAP_MIN) * D.XP_PER_MIN.get(s["type"], 0.5))


ACHIEVEMENTS = [
    # id, título, descrição, xp, ícone, condição(stats)
    ("first_session", "Primeiro passo", "Registrar a primeira sessão de estudo.", 25, "play", lambda s: s["sessions"] >= 1),
    ("first_build", "Mãos na massa", "Primeira sessão de prática ou projeto.", 50, "hammer", lambda s: s["build_sessions"] >= 1),
    ("focus_5", "Foco profundo", "5 sessões no Focus Mode com 25+ min.", 75, "timer", lambda s: s["focus_25"] >= 5),
    ("streak_3", "Ritmo", "3 dias de estudo seguidos (descanso não quebra).", 50, "flame", lambda s: s["best_streak"] >= 3),
    ("streak_7", "Consistência", "7 dias de estudo seguidos.", 120, "flame", lambda s: s["best_streak"] >= 7),
    ("streak_21", "Hábito formado", "21 dias de estudo seguidos.", 300, "flame", lambda s: s["best_streak"] >= 21),
    ("hours_10", "10 horas", "10h de estudo registradas.", 60, "clock", lambda s: s["total_min"] >= 600),
    ("hours_50", "50 horas", "50h de estudo registradas.", 200, "clock", lambda s: s["total_min"] >= 3000),
    ("hours_100", "Centena", "100h de estudo registradas.", 400, "clock", lambda s: s["total_min"] >= 6000),
    ("reviews_10", "Memória longa", "10 revisões espaçadas concluídas.", 80, "repeat", lambda s: s["reviews_done"] >= 10),
    ("reviews_ontime_20", "Revisora pontual", "20 revisões feitas no prazo.", 150, "repeat", lambda s: s["reviews_on_time"] >= 20),
    ("first_course", "Curso concluído", "Concluir aulas e prática de um curso.", 100, "book-open", lambda s: s["contents_done"] >= 1),
    ("five_courses", "Cinco cursos", "Concluir 5 cursos (aulas + prática).", 250, "layers", lambda s: s["contents_done"] >= 5),
    ("doer", "Fazer > Assistir", "Tempo de prática + projeto maior que o de vídeo (mín. 5h de vídeo).", 250, "zap",
     lambda s: s["video_min"] >= 300 and s["build_min"] > s["video_min"]),
    ("first_milestone", "Primeiro milestone", "Concluir o primeiro milestone do AI Agent Lab.", 50, "target", lambda s: s["milestones_done"] >= 1),
    ("first_agent", "Primeiro agente", "Concluir o LAB-5 (Primeiro Agente).", 200, "brain-circuit", lambda s: "LAB-5" in s["stages_done"]),
    ("rag_online", "Conhecimento conectado", "Concluir o LAB-6 (RAG).", 200, "database", lambda s: "LAB-6" in s["stages_done"]),
    ("team_of_agents", "Time de agentes", "Concluir o LAB-7 (Multi-Agent).", 200, "git-branch", lambda s: "LAB-7" in s["stages_done"]),
    ("capstone", "Projeto final", "Concluir o Projeto Final do laboratório.", 500, "trophy", lambda s: "LAB-9" in s["stages_done"]),
]


def compute(conn: sqlite3.Connection, prog: dict, reviews: list[dict], stages: list[dict],
            streak: dict, today: date) -> dict:
    sessions = db.rows(conn, "SELECT * FROM sessions ORDER BY date, id")
    ledger: list[dict] = []
    for s in sessions:
        xp = _session_xp(s)
        if xp:
            ledger.append({"date": s["date"], "xp": xp, "label": f"{TYPE_PT.get(s['type'], s['type'])} · {s['title']}", "kind": s["type"]})
    lessons = db.rows(conn, "SELECT lesson_id, completed_on FROM lesson_progress WHERE completed_on IS NOT NULL")
    titles = {l["id"]: l["title"] for l in db.rows(conn, "SELECT id, title FROM lessons")}
    for l in lessons:
        if l["lesson_id"] in titles:
            ledger.append({"date": l["completed_on"], "xp": D.XP_LESSON, "label": f"Aula concluída · {titles[l['lesson_id']]}", "kind": "LESSON"})
    for mid, planned in prog["practice_planned"].items():
        if planned and prog["practice_credit"].get(mid, 0) >= planned:
            ledger.append({"date": None, "xp": D.XP_PRACTICE_UNIT, "label": f"Prática completa · {mid}", "kind": "PRACTICE_UNIT"})
    for r in reviews:
        if r["status"] == "done":
            ledger.append({"date": r["done_on"], "xp": D.XP_REVIEW_ON_TIME if r["on_time"] else D.XP_REVIEW_LATE,
                           "label": f"Revisão D+{r['interval']} ({'no prazo' if r['on_time'] else 'atrasada'})", "kind": "REVIEW_DONE"})
    stages_done = set()
    for st in stages:
        for t in st["tasks"]:
            if t["done_on"]:
                ledger.append({"date": t["done_on"], "xp": D.XP_LAB_TASK, "label": f"Tarefa · {t['title']}", "kind": "LAB_TASK"})
        for m in st["milestones"]:
            if m["done_on"]:
                ledger.append({"date": m["done_on"], "xp": D.XP_MILESTONE, "label": f"Milestone · {m['title']}", "kind": "MILESTONE"})
        if st["effective_status"] == "done":
            stages_done.add(st["id"])
            ledger.append({"date": None, "xp": D.XP_FINAL_STAGE if st["unlock_after"] is None else D.XP_STAGE,
                           "label": f"Estágio concluído · {st['title']}", "kind": "STAGE"})
    contents_done = [cid for cid, pc in prog["per_content"].items() if pc["complete"]]
    for cid in contents_done:
        ledger.append({"date": None, "xp": D.XP_CONTENT_DONE, "label": f"Curso concluído · {cid}", "kind": "CONTENT"})

    mt = prog["minutes_by_type"]
    stats = {
        "sessions": len([s for s in sessions if s["status"] != "missed"]),
        "build_sessions": len([s for s in sessions if s["type"] in ("PRACTICE", "PROJECT") and s["status"] != "missed"]),
        "focus_25": len([s for s in sessions if s["focus"] and s["actual_min"] >= 25]),
        "best_streak": streak["best"],
        "total_min": sum(mt.values()),
        "video_min": mt["VIDEO"],
        "build_min": mt["PRACTICE"] + mt["PROJECT"],
        "reviews_done": len([r for r in reviews if r["status"] == "done"]),
        "reviews_on_time": len([r for r in reviews if r["status"] == "done" and r["on_time"]]),
        "contents_done": len(contents_done),
        "milestones_done": sum(1 for st in stages for m in st["milestones"] if m["done_on"]),
        "stages_done": stages_done,
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
            "achievements": achievements, "ledger": ledger[:60], "xp_by_kind": by_kind, "stats": {k: v for k, v in stats.items() if k != "stages_done"},
            "rules": {"per_min": D.XP_PER_MIN, "lesson": D.XP_LESSON, "practice_unit": D.XP_PRACTICE_UNIT,
                      "review_on_time": D.XP_REVIEW_ON_TIME, "review_late": D.XP_REVIEW_LATE, "lab_task": D.XP_LAB_TASK,
                      "milestone": D.XP_MILESTONE, "stage": D.XP_STAGE, "final_stage": D.XP_FINAL_STAGE, "content": D.XP_CONTENT_DONE}}


def competencies(prog: dict, contents: dict, stages: list[dict], reviews: list[dict], learned: dict[str, set], baselines: dict | None = None) -> list[dict]:
    """learned: data → conteúdos estudados naquele dia (base das revisões D+1/D+7/D+30)."""
    out = []
    for comp in D.COMPETENCIES:
        cids = [cid for cid, c in contents.items() if comp["id"] in c["competencies"]]
        vt = sum(prog["per_content"][c]["video_total"] for c in cids)
        vd = sum(prog["per_content"][c]["video_done"] for c in cids)
        pt = sum(prog["per_content"][c]["practice_total"] for c in cids)
        pd = sum(prog["per_content"][c]["practice_done"] for c in cids)
        sts = [s for s in stages if comp["id"] in s["competencies"]]
        parts: dict[str, float] = {}
        if vt:
            parts["content"] = vd / vt
            days = {d for d, cs in learned.items() if cs & set(cids)}
            rv = [r for r in reviews if r["learned_on"] in days]
            # revisão só conta quando feita: D+30 pendente impede "domínio" precoce
            parts["review"] = (len([r for r in rv if r["status"] == "done"]) / len(rv)) * (vd / vt) if rv else 0.0
        if pt:
            parts["practice"] = pd / pt
        if sts:
            parts["project"] = sum(s["pct"] for s in sts) / len(sts)
        wsum = sum(D.COMPETENCY_WEIGHTS[k] for k in parts) or 1
        score = sum(D.COMPETENCY_WEIGHTS[k] * v for k, v in parts.items()) / wsum
        base = float((baselines or {}).get(comp["id"], comp["baseline"]))
        level = base + (1 - base) * score
        out.append({**comp, "baseline": base, "baseline_default": comp["baseline"], "level": level, "score": score, "parts": parts,
                    "courses": [contents[c]["title"] for c in cids], "stages": [s["id"] for s in sts]})
    return out
