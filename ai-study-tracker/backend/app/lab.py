"""AI Agent Lab: estágios, tarefas, milestones."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from . import db

STATUSES = ("locked", "available", "in_progress", "done")


def seed_lab(conn: sqlite3.Connection, path: Path) -> None:
    if db.row(conn, "SELECT COUNT(*) AS n FROM lab_stages")["n"]:
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    for s in data["stages"]:
        conn.execute(
            """INSERT INTO lab_stages(id, ord, title, subtitle, objective, implementation, competencies,
               unlock_after, planned_hours, status) VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (s["id"], s["order"], s["title"], s.get("subtitle"), s["objective"], s["implementation"],
             json.dumps(s["competencies"]), s.get("unlock_after"), s["planned_hours"], "locked"))
        for i, t in enumerate(s["tasks"], start=1):
            conn.execute("INSERT INTO lab_tasks(stage_id, ord, title) VALUES (?,?,?)", (s["id"], i, t))
        for i, m in enumerate(s["milestones"], start=1):
            conn.execute("INSERT INTO lab_milestones(stage_id, ord, title) VALUES (?,?,?)", (s["id"], i, m))


def stages(conn: sqlite3.Connection, prog: dict, contents: dict) -> list[dict]:
    out = []
    tasks = db.rows(conn, "SELECT * FROM lab_tasks ORDER BY stage_id, ord")
    mss = db.rows(conn, "SELECT * FROM lab_milestones ORDER BY stage_id, ord")
    for s in db.rows(conn, "SELECT * FROM lab_stages ORDER BY ord"):
        s["competencies"] = db.loads(s["competencies"], [])
        s["tasks"] = [t for t in tasks if t["stage_id"] == s["id"]]
        s["milestones"] = [m for m in mss if m["stage_id"] == s["id"]]
        planned = s["planned_hours"] * 60
        s["planned_min"] = planned
        s["worked_min"] = prog["project_credit"].get(s["id"], 0.0)
        trig = s["unlock_after"]
        if trig and trig in contents:
            s["unlock_title"] = contents[trig]["title"]
            s["trigger_done"] = prog["per_content"][trig]["lessons_done"] == prog["per_content"][trig]["lessons"]
        else:
            s["unlock_title"] = "todo o conteúdo da formação"
            s["trigger_done"] = all(pc["lessons_done"] == pc["lessons"] for pc in prog["per_content"].values())
        # status efetivo: desbloqueia automaticamente quando o curso-gatilho termina
        eff = s["status"]
        if eff == "locked" and (s["trigger_done"] or s["worked_min"] > 0):
            eff = "available" if s["worked_min"] == 0 else "in_progress"
        s["effective_status"] = eff
        n_items = len(s["tasks"]) + len(s["milestones"])
        n_done = len([t for t in s["tasks"] if t["done_on"]]) + len([m for m in s["milestones"] if m["done_on"]])
        s["checklist_pct"] = n_done / n_items if n_items else 0
        s["pct"] = 1.0 if eff == "done" else min(1.0, 0.5 * min(1, s["worked_min"] / planned if planned else 0) + 0.5 * s["checklist_pct"])
        out.append(s)
    return out


def update_stage(conn: sqlite3.Connection, stage_id: str, fields: dict, today: str) -> None:
    if not db.row(conn, "SELECT id FROM lab_stages WHERE id=?", (stage_id,)):
        raise KeyError(stage_id)
    allowed = {k: v for k, v in fields.items() if k in ("status", "notes", "repo_url") and v is not None}
    if "status" in allowed and allowed["status"] not in STATUSES:
        raise ValueError("status inválido")
    for k, v in allowed.items():
        conn.execute(f"UPDATE lab_stages SET {k}=? WHERE id=?", (v, stage_id))


def toggle(conn: sqlite3.Connection, table: str, item_id: int, today: str) -> dict:
    assert table in ("lab_tasks", "lab_milestones")
    r = db.row(conn, f"SELECT * FROM {table} WHERE id=?", (item_id,))
    if not r:
        raise KeyError(item_id)
    new = None if r["done_on"] else today
    conn.execute(f"UPDATE {table} SET done_on=? WHERE id=?", (new, item_id))
    if table == "lab_milestones":
        # todos os milestones concluídos → estágio concluído
        left = db.row(conn, "SELECT COUNT(*) AS n FROM lab_milestones WHERE stage_id=? AND done_on IS NULL", (r["stage_id"],))["n"]
        st = db.row(conn, "SELECT status FROM lab_stages WHERE id=?", (r["stage_id"],))["status"]
        if left == 0:
            conn.execute("UPDATE lab_stages SET status='done' WHERE id=?", (r["stage_id"],))
        elif st == "done":
            conn.execute("UPDATE lab_stages SET status='in_progress' WHERE id=?", (r["stage_id"],))
    return {**r, "done_on": new}
