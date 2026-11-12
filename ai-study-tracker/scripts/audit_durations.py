"""Auditoria independente das durações do catálogo.

Verifica, sem reutilizar a lógica do app:
 1. soma das aulas de cada curso (a partir de data/catalog.json) × card do site (truncado em minutos);
 2. contagem de aulas × contagem anunciada no card;
 3. numeração contínua das aulas, IDs únicos, títulos duplicados dentro do curso;
 4. sensibilidade das leituras incertas (zero riscado 0↔8): quais trocas ainda fecham com o card;
 5. soma das trilhas × cabeçalho; carga bruta/única/duplicada;
 6. banco de dados (importação real) × catálogo.
"""
from __future__ import annotations

import itertools
import json
import os
import re
import sqlite3
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# contagem de aulas anunciada nos cards/telas do player (transcrita das mensagens da usuária)
EXPECTED_LESSONS = {
    "START-CLAUDE": 1, "GENAI-001": 9, "CLAUDE-001": 28, "CODE-001": 1, "CLAUDE-002": 13, "START-OPENCLAW": 2,
    "OPENCLAW-001": 8, "OPENCLAW-002": 10, "START-HERMES": 1, "HERMES-001": 7, "START-GPT": 1, "GPT-001": 5,
    "START-APPS": 3, "PY-001": 26, "PY-002": 16, "UI-001": 2, "LANG-001": 12, "LANG-002": 6, "START-TOOLS": 1,
    "IDE-001": 17, "IDE-002": 10, "IDE-003": 11, "CODE-002": 13, "START-N8N": 1, "N8N-001": 23, "N8N-002": 5,
    "N8N-003": 9, "N8N-004": 17, "N8N-005": 4, "N8N-006": 5, "N8N-007": 7, "START-PYTHON": 2, "LLM-001": 14,
    "LOGIC-001": 17, "PYTHON-001": 47, "SETUP-001": 25, "PROMPT-001": 20, "AGNO-001": 30, "AGENT-001": 6,
    "AGENT-002": 9, "AGENT-003": 8, "AGENT-004": 11, "GIT-001": 20,
}


def secs(s):
    p = [int(x) for x in s.split(":")]
    return p[0] * 60 + p[1] if len(p) == 2 else p[0] * 3600 + p[1] * 60 + p[2]


def fmt(t):
    return f"{t // 3600}:{t % 3600 // 60:02d}:{t % 60:02d}"


def swaps(d):
    """Variações 0↔8 em UM dígito (o zero riscado confunde com 8)."""
    out = set()
    for i, ch in enumerate(d):
        if ch == "0":
            out.add(d[:i] + "8" + d[i + 1:])
        elif ch == "8":
            out.add(d[:i] + "0" + d[i + 1:])
    return out


def main() -> int:
    verbose = "--verbose" in sys.argv
    cat = json.loads((ROOT / "data" / "catalog.json").read_text(encoding="utf-8"))
    problems, notes = [], []
    totals = {}
    optional_ids = {k for k, v in cat["contents"].items() if v.get("optional")}
    print(f"{'curso':15}{'aulas':>6}{'soma':>10}{'card':>7}  floor==card  contagem")
    for cid, c in cat["contents"].items():
        lessons = [l for m in c["modules"] for l in m["lessons"]]
        total = sum(secs(l["duration"]) for l in lessons if "duration" in l)
        totals[cid] = total   # opcionais ficam em `totals`, mas são excluídos das somas únicas abaixo
        nums = [l["n"] for l in lessons]
        ok_floor = total // 60 == c["card_min"]
        ok_count = len(lessons) == EXPECTED_LESSONS[cid]
        ok_seq = nums == list(range(1, len(nums) + 1))
        ids = [l["id"] for l in lessons]
        titles = [l["title"].strip().lower() for l in lessons]
        print(f"{cid:15}{len(lessons):6}{fmt(total):>10}{c['card_min']:7}  {'OK ' if ok_floor else 'DIF'}          {'OK' if ok_count else 'DIF'}")
        if not ok_floor:
            problems.append(f"{cid}: soma {fmt(total)} (floor {total // 60} min) ≠ card {c['card_min']} min")
        if not ok_count:
            problems.append(f"{cid}: {len(lessons)} aulas ≠ {EXPECTED_LESSONS[cid]} anunciadas")
        if not ok_seq:
            problems.append(f"{cid}: numeração de aulas descontínua")
        if len(ids) != len(set(ids)):
            problems.append(f"{cid}: IDs de aula repetidos")
        dup = {t for t in titles if titles.count(t) > 1 and not t.startswith(("quiz", "teste"))}
        if dup:
            notes.append(f"{cid}: títulos repetidos dentro do curso: {sorted(dup)}")

    # 4) sensibilidade: trocas 0↔8 em UM dígito de UMA aula; quais ainda fecham com o card
    print("\nSensibilidade das leituras com zero riscado (troca 0↔8 em um dígito):")
    flagged = 0
    for cid, c in cat["contents"].items():
        lessons = [l for m in c["modules"] for l in m["lessons"] if "duration" in l]
        for l in lessons:
            alts_ok, alts_bad = [], []
            for alt in swaps(l["duration"]):
                try:
                    delta = secs(alt) - secs(l["duration"])
                except ValueError:
                    continue
                if (totals[cid] + delta) // 60 == c["card_min"]:
                    alts_ok.append(alt)
                else:
                    alts_bad.append(alt)
            if alts_ok:
                flagged += 1
                notes.append(f"{cid} aula {l['n']} «{l['title'][:38]}» {l['duration']}: alternativas que também fecham com o card: {sorted(alts_ok)} (impacto ≤ {max(abs(secs(a) - secs(l['duration'])) for a in alts_ok)}s)")
    lo = sum(c["card_min"] * 60 for k, c in cat["contents"].items() if k not in optional_ids)
    print(f"  Cada curso fica em [card, card+1 min): o ÚNICO total está entre {fmt(lo)} e {fmt(lo + 60 * len([1 for k in cat['contents'] if k not in optional_ids]))}.")
    print(f"  {flagged} aulas têm alternativa de leitura que também fecharia com o card (impacto em segundos, cursos já conferem ao minuto).")

    # 5) trilhas e carga
    print("\nTrilhas (soma das aulas × cabeçalho do site):")
    gross = 0
    seen = {}
    for t in cat["tracks"]:
        s = sum(totals[c] for c in t["courses"])
        gross += s
        for c in t["courses"]:
            seen[c] = seen.get(c, 0) + 1
        diff = s / 60 - t["header_min"]
        print(f"  {t['id']} {t['title'][:44]:44} {fmt(s):>9}  cabeçalho {t['header_min'] // 60}h{t['header_min'] % 60:02d}  dif {diff:+.1f} min")
        if abs(diff) > 5:
            notes.append(f"{t['id']} {t['title']}: soma {fmt(s)} difere {diff:+.1f} min do cabeçalho do site (cards individuais conferem)")
    unique = sum(v for k, v in totals.items() if k not in optional_ids)
    dup_total = sum(totals[c] * (n - 1) for c, n in seen.items() if n > 1)
    print(f"\nBruta {fmt(gross)} · duplicado {fmt(dup_total)} · ÚNICO {fmt(unique)}  ({unique / 3600:.2f} h)")
    assert gross - dup_total == unique
    core = {k: c for k, c in cat["contents"].items() if k not in optional_ids}
    n_lessons = sum(len([l for m in c['modules'] for l in m['lessons']]) for c in core.values())
    nodur = sum(1 for c in core.values() for m in c["modules"] for l in m["lessons"] if "duration" not in l)
    for k in sorted(optional_ids):
        print(f"Opcional (fora dos totais): {k} · {fmt(totals[k])}")
    print(f"Cursos {len(core)} · aulas {n_lessons} · sem duração {nodur}")

    # 6) banco × catálogo
    os.environ["AST_DB"] = str(Path(tempfile.mkdtemp()) / "audit.db")
    from backend.app import catalog, db
    conn = db.connect()
    db.init_schema(conn)
    catalog.import_catalog(conn, cat)
    a = catalog.analysis(conn)
    db_unique = round(a["unique_min"] * 60)
    db_gross = round(a["gross_min"] * 60)
    if a["optional"] and a["courses"] != 42:
        problems.append("opcional entrou na contagem de cursos")
    print(f"\nBanco: único {fmt(db_unique)} · bruto {fmt(db_gross)} · aulas {a['lessons']}")
    if db_unique != unique:
        problems.append(f"banco ({fmt(db_unique)}) ≠ catálogo ({fmt(unique)})")
    if db_gross != gross:
        problems.append(f"bruto do banco ({fmt(db_gross)}) ≠ catálogo ({fmt(gross)})")
    for r in conn.execute("SELECT id, duration_min FROM contents"):
        if round(r["duration_min"] * 60) != totals[r["id"]]:
            problems.append(f"{r['id']}: banco {round(r['duration_min'] * 60)}s ≠ catálogo {totals[r['id']]}s")

    print("\nNotas:" + ("" if verbose else " (use --verbose para a lista completa de leituras alternativas)"))
    for n in notes:
        if verbose or "alternativas" not in n:
            print("  -", n)
    print("\nPROBLEMAS:", "nenhum" if not problems else "")
    for p in problems:
        print("  *", p)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
