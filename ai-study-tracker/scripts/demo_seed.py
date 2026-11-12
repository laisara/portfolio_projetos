"""Cria um banco de DEMONSTRAÇÃO simulando semanas de estudo (para prints e testes manuais).

Uso:
    python scripts/demo_seed.py --db database/demo.db --until 2026-12-03
Depois:
    set AST_DB=database\\demo.db & set AST_TODAY=2026-12-03 & start.bat

Simula: dias cumpridos, um dia com atraso (metade do plano), um dia perdido,
um sábado com hora extra, tarefas/milestones do Lab e notas.
Nunca use o banco real (study_tracker.db) com este script.
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

NOTES = [
    "Ficou claro como a janela de contexto limita o que o modelo 'lembra'.",
    "Reproduzi o fluxo no meu projeto de dashboard — funcionou de primeira.",
    "Ainda confuso com quando usar SubAgents vs Skills. Revisar D+7.",
    "Criei 3 prompts de extração com saída JSON validada.",
    "",
    "",
]


def session_for(item: dict, day: str, factor: float = 1.0) -> dict:
    k = item["kind"]
    actual = max(3, round(item["minutes"] * factor))
    base = {"date": day, "title": item["title"], "planned_min": item["minutes"], "actual_min": actual,
            "status": "done" if factor >= 0.95 else "partial", "focus": random.random() < 0.7,
            "notes": random.choice(NOTES)}
    if k == "video":
        return {**base, "type": "VIDEO", "target_kind": "lesson", "target_id": item["ref"],
                "complete_lessons": [item["ref"]] if factor >= 0.95 and not item["detail"].get("partial")
                and (not item["detail"].get("course_level") or item["detail"].get("block") == item["detail"].get("of")) else []}
    if k == "practice":
        return {**base, "type": "PRACTICE", "target_kind": "module", "target_id": item["ref"]}
    if k == "project":
        return {**base, "type": "PROJECT", "target_kind": "stage", "target_id": item["ref"]}
    return {**base, "type": "REVIEW", "target_kind": "review", "review_keys": [r["key"] for r in item["detail"]["reviews"]]}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=str(ROOT / "database" / "demo.db"))
    ap.add_argument("--until", default="2026-12-03", help="'hoje' simulado (não incluso, exceto 1º item)")
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
                items = items[:2]  # "hoje": parte do plano já feita
            elif iso == "2026-11-26":
                items = []  # dia perdido → redistribuído
            elif iso == "2026-11-19":
                items = items[: max(1, len(items) // 2)]  # atraso: metade do plano
            for i, it in enumerate(items):
                factor = random.choice([0.9, 1.0, 1.0, 1.0, 1.1])
                if iso == "2026-11-19" and i == len(items) - 1:
                    factor = 0.6
                r = c.post("/api/sessions", json=session_for(it, iso, factor))
                assert r.status_code == 201, r.text
            if iso == "2026-11-28":  # sábado com hora extra no Lab
                c.post("/api/sessions", json={"date": iso, "type": "PROJECT", "target_kind": "stage", "target_id": "LAB-2",
                                              "title": "AI Agent Lab · LLM API Service (extra)", "planned_min": 0, "actual_min": 40,
                                              "notes": "Adiantei o logging de custos."})
            if iso == "2026-11-22":
                lab = c.get("/api/lab").json()["stages"]
                for t in lab[0]["tasks"]:
                    c.post(f"/api/lab/tasks/{t['id']}/toggle")
                for m in lab[0]["milestones"]:
                    c.post(f"/api/lab/milestones/{m['id']}/toggle")
            if iso == "2026-11-30":
                lab = c.get("/api/lab").json()["stages"]
                for t in lab[1]["tasks"][:3]:
                    c.post(f"/api/lab/tasks/{t['id']}/toggle")
                c.post(f"/api/lab/milestones/{lab[1]['milestones'][0]['id']}/toggle")
                c.patch("/api/lab/stages/LAB-2", json={"notes": "Stack: FastAPI + httpx + SQLite.\n- Retries com backoff exponencial\n- Log de tokens e custo por chamada\nPróximo: endpoint /ask com streaming.",
                                                        "repo_url": "C:\\lab\\02-llm-service"})
            d += timedelta(days=1)
        dash = c.get("/api/dashboard").json()
        print(f"demo ok: {db_path} · hoje={until} · progresso {dash['overall']:.0%} · XP {dash['xp']} · {dash['level']['name']} · término {dash['plan_end']}")


if __name__ == "__main__":
    main()
