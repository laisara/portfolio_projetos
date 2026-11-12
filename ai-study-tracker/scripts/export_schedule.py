"""Gera docs/CRONOGRAMA.md com o cronograma original completo (dia a dia)."""
from __future__ import annotations

import os
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ["AST_DB"] = str(Path(tempfile.mkdtemp()) / "schedule.db")

from backend.app import catalog, config, db, lab, settings, tracker  # noqa: E402
from backend.app.domain import WEEKDAYS_PT  # noqa: E402


def hm(m: float) -> str:
    m = round(m)
    return f"{m // 60}h{m % 60:02d}" if m >= 60 else f"{m}min"


conn = db.connect()
db.init_schema(conn)
cfg = settings.load(conn)
catalog.ensure_catalog(conn, config.catalog_path())
lab.seed_lab(conn, config.lab_path())
res = tracker.pristine_plan(conn)
names = {c["id"]: c["title"] for c in db.rows(conn, "SELECT id, title FROM contents")}

lines = ["# Cronograma completo (plano original)", "",
         f"Gerado por `scripts/export_schedule.py` a partir de `data/catalog.json` e `data/lab.json`. "
         f"Período **{res.days[0].date:%d/%m/%Y} → {res.end_date:%d/%m/%Y}**. "
         "No app, o cronograma é **adaptativo**: este é o plano de referência (dia 0).", "",
         "Legenda: 🎬 aula (APRENDER) · 🛠 prática (ENTENDER/CONSTRUIR) · 🧪 projeto (CONSOLIDAR) · 🔁 revisão (REVISAR)", ""]
week = None
for d in res.days:
    wk = d.date.isocalendar()[1]
    if wk != week:
        week = wk
        lines += ["", f"## Semana de {d.date:%d/%m}", "", "| Data | Dia | Conteúdo | Aulas | Prática | Projeto | Revisão | Total |", "|---|---|---|---|---|---|---|---|"]
    by = defaultdict(float)
    for it in d.items:
        by[it.kind] += it.minutes
    if not d.items:
        label = "**Descanso**" if d.capacity == 0 else "—"
        lines.append(f"| {d.date:%d/%m} | {WEEKDAYS_PT[d.date.weekday()]} | {label} | | | | | |")
        continue
    content = []
    for it in d.items:
        if it.kind == "video":
            t = names.get(it.content_id, it.title)
            if f"🎬 {t}" not in content:
                content.append(f"🎬 {t}")
        elif it.kind == "project":
            content.append(f"🧪 {it.title.replace('AI Agent Lab · ', 'Lab: ')}")
    if not content and by["practice"]:
        content.append("🛠 Prática")
    lines.append(f"| {d.date:%d/%m} | {WEEKDAYS_PT[d.date.weekday()]} | {'<br>'.join(content)} | "
                 f"{hm(by['video']) if by['video'] else ''} | {hm(by['practice']) if by['practice'] else ''} | "
                 f"{hm(by['project']) if by['project'] else ''} | {hm(by['review']) if by['review'] else ''} | **{hm(d.total)}** |")
t = res.totals
lines += ["", "## Totais", "", f"- Vídeo (conteúdo único): **{hm(t['video'])}**", f"- Prática: **{hm(t['practice'])}**",
          f"- Projetos (AI Agent Lab): **{hm(t['project'])}**", f"- Revisão: **{hm(t['review'])}**",
          f"- Total: **{hm(sum(t.values()))}** em {len([d for d in res.days if d.items])} dias de estudo"]
out = ROOT / "docs" / "CRONOGRAMA.md"
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"ok: {out}")
