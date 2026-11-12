r"""Cria um banco de DEMONSTRAÇÃO simulando semanas de estudo (para prints e testes manuais).

Uso:
    python scripts/demo_seed.py --db database/demo.db --until 2026-12-03
Depois (Windows):
    set AST_DB=database\demo.db & set AST_TODAY=2026-12-03 & python scripts\run.py

Simula: dias cumpridos, um dia com atraso (metade do plano), um dia perdido, sessões de prática/projeto
manuais e notas. Nunca use o banco real (study_tracker.db) com este script.
"""
from __future__ import annotations

import argparse
import os
import random
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

NOTES = ["Ficou claro como a janela de contexto limita o que o modelo 'lembra'.",
         "Reproduzi o fluxo no meu projeto — funcionou de primeira.",
         "Ainda confuso com quando usar Skills vs SubAgents. Revisar D+7.", "", "", ""]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=str(ROOT / "database" / "demo.db"))
    ap.add_argument("--until", default="2026-12-03", help="'hoje' simulado")
    args = ap.parse_args()
    db_path = Path(args.db)
    if db_path.name == "study_tracker.db":
        sys.exit("Recusado: não sobrescreva o banco real.")
    for suffix in ("", "-wal", "-shm"):
        Path(str(db_path) + suffix).unlink(missing_ok=True)
    os.environ["AST_DB"] = str(db_path)
    os.environ["AST_TODAY"] = "2026-11-13"
    random.seed(7)

    from fastapi.testclient import TestClient
    from backend.app.main import app

    until = date.fromisoformat(args.until)
    with TestClient(app) as c:
        d = date(2026, 11, 13)
        while d <= until:
            iso = d.isoformat()
            os.environ["AST_TODAY"] = iso
            items = c.get("/api/today").json()["items"]
            if d == until:
                items = items[:5]            # "hoje": parte do plano já feita
            elif iso == "2026-11-26":
                items = []                   # dia perdido → redistribuído
            elif iso == "2026-11-19":
                items = items[: max(1, len(items) // 2)]   # atraso: metade do plano
            done_lessons, review_keys, minutes = [], [], 0.0
            for it in items:
                if it["kind"] == "video" and it["detail"].get("lesson_id") and not it["detail"].get("partial"):
                    done_lessons.append(it["ref"])
                    minutes += it["minutes"]
                elif it["kind"] == "practice":
                    c.post("/api/sessions", json={"date": iso, "type": "PRACTICE", "target_kind": "content", "target_id": it["ref"],
                                                  "title": it["title"], "planned_min": round(it["minutes"]), "actual_min": max(1, round(it["minutes"])),
                                                  "notes": "Reproduzi o exemplo no meu projeto."})
                elif it["kind"] == "project":
                    c.post("/api/sessions", json={"date": iso, "type": "PROJECT", "target_kind": "project", "target_id": it["ref"],
                                                  "title": it["title"], "planned_min": round(it["minutes"]), "actual_min": max(1, round(it["minutes"]))})
                elif it["kind"] == "review":
                    review_keys += [r["key"] for r in it["detail"]["reviews"]]
                    minutes += it["minutes"]
            if done_lessons or review_keys:
                factor = random.choice([0.95, 1.0, 1.0, 1.1])
                r = c.post("/api/sessions", json={
                    "date": iso, "type": "VIDEO", "title": "Sessão de estudo", "planned_min": round(minutes),
                    "actual_min": max(1, round(minutes * factor)), "focus": random.random() < 0.7,
                    "notes": random.choice(NOTES), "complete_lessons": done_lessons, "review_keys": review_keys})
                assert r.status_code == 201, r.text
            if iso == "2026-11-28":              # itens de checklist do projeto 1 concluídos
                pr = c.get("/api/projects").json()["projects"][0]
                for item in pr["items"][:2]:
                    c.post(f"/api/projects/items/{item['id']}/toggle")
                c.patch("/api/lab/stages/LAB-1", json={"status": "done"}); c.patch("/api/lab/stages/LAB-2", json={"status": "doing"})
            d += timedelta(days=1)
        dash = c.get("/api/dashboard").json()
        print(f"demo ok: {db_path} · hoje={until} · progresso {dash['overall']:.0%} · XP {dash['xp']} · {dash['level']['name']} · término {dash['plan_end']}")


if __name__ == "__main__":
    main()
