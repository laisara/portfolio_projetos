"""Auditoria de durações como teste permanente (scripts/audit_durations.py + plano × catálogo)."""
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_independent_audit_passes():
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "audit_durations.py")], capture_output=True, text=True, cwd=ROOT)
    assert r.returncode == 0, r.stdout[-2000:] + r.stderr[-500:]
    assert "ÚNICO 66:21:37" in r.stdout and "PROBLEMAS: nenhum" in r.stdout


def test_plan_schedules_every_lesson_exactly_once_with_real_duration(client):
    days = client.get("/api/calendar?start=2026-11-13&end=2027-03-01").json()["days"]
    per = defaultdict(float)
    count = defaultdict(int)
    for d in days:
        for it in d["items"]:
            if it["kind"] == "video":
                per[it["ref"]] += it["minutes"]
                count[it["ref"]] += 1
    assert len(per) == 462 and max(count.values()) == 1          # 463 − aviso "em breve"; nenhuma aula partida/duplicada
    total_sec = round(sum(per.values()) * 60)
    assert total_sec == 66 * 3600 + 21 * 60 + 37
    assert len({it["content_id"] for d in days for it in d["items"] if it["kind"] == "video"}) == 42


def test_catalog_numbers_in_api_are_exact(client):
    a = client.get("/api/catalog").json()["analysis"]
    assert round(a["unique_min"] * 60) == 66 * 3600 + 21 * 60 + 37
    assert round(a["gross_min"] * 60) == 74 * 3600 + 30 * 60 + 39
    assert round(a["duplicate_min"] * 60) == 8 * 3600 + 9 * 60 + 2
