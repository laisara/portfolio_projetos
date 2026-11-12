"""Projetos (lista simples com checklist) e AI Agent Lab (etapas simples). Sem subsistema: só dados e estado."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from . import db

LAB_STATUSES = ("todo", "doing", "done")


def seed(conn: sqlite3.Connection, projects_file: Path, lab_file: Path) -> None:
    if not db.row(conn, "SELECT COUNT(*) AS n FROM projects")["n"]:
        for i, p in enumerate(json.loads(projects_file.read_text(encoding="utf-8"))["projects"], start=1):
            conn.execute("INSERT INTO projects(id, ord, title, description, planned_hours, unlock_after) VALUES (?,?,?,?,?,?)",
                         (p["id"], i, p["title"], p["description"], p["planned_hours"], p.get("unlock_after")))
            for j, t in enumerate(p["checklist"], start=1):
                conn.execute("INSERT INTO project_items(project_id, ord, title) VALUES (?,?,?)", (p["id"], j, t))
    if not db.row(conn, "SELECT COUNT(*) AS n FROM lab_stages")["n"]:
        for i, s in enumerate(json.loads(lab_file.read_text(encoding="utf-8"))["stages"], start=1):
            conn.execute("INSERT INTO lab_stages(id, ord, title, description, practice) VALUES (?,?,?,?,?)",
                         (s["id"], i, s["title"], s["description"], s["practice"]))


def project_credit(conn: sqlite3.Connection) -> dict[str, float]:
    return {r["target_id"]: r["m"] for r in db.rows(
        conn, "SELECT target_id, SUM(actual_min) AS m FROM sessions WHERE type='PROJECT' AND target_kind='project' AND status!='missed' GROUP BY target_id")}


def list_projects(conn: sqlite3.Connection, content_done: dict[str, bool], content_titles: dict[str, str]) -> list[dict]:
    credit = project_credit(conn)
    items = db.rows(conn, "SELECT * FROM project_items ORDER BY project_id, ord")
    out = []
    for p in db.rows(conn, "SELECT * FROM projects ORDER BY ord"):
        its = [i for i in items if i["project_id"] == p["id"]]
        done = len([i for i in its if i["done_on"]])
        p["items"] = its
        p["items_done"] = done
        p["progress"] = done / len(its) if its else 0.0
        p["status"] = "done" if its and done == len(its) else ("doing" if done or credit.get(p["id"]) else "todo")
        p["worked_min"] = credit.get(p["id"], 0.0)
        p["planned_min"] = p["planned_hours"] * 60
        ua = p["unlock_after"]
        p["unlock_title"] = content_titles.get(ua) if ua else "toda a formação"
        p["unlocked"] = content_done.get(ua, False) if ua else all(content_done.values())
        out.append(p)
    return out


def toggle_item(conn: sqlite3.Connection, item_id: int, today: str) -> dict:
    r = db.row(conn, "SELECT * FROM project_items WHERE id=?", (item_id,))
    if not r:
        raise KeyError(item_id)
    new = None if r["done_on"] else today
    conn.execute("UPDATE project_items SET done_on=? WHERE id=?", (new, item_id))
    return {**r, "done_on": new}


def set_stage_status(conn: sqlite3.Connection, stage_id: str, status: str) -> None:
    if status not in LAB_STATUSES:
        raise ValueError("status inválido")
    if not db.row(conn, "SELECT id FROM lab_stages WHERE id=?", (stage_id,)):
        raise KeyError(stage_id)
    conn.execute("UPDATE lab_stages SET status=? WHERE id=?", (status, stage_id))
