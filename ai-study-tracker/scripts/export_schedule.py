"""Gera docs/CRONOGRAMA.md com o cronograma original completo (dia a dia): aulas + revisão."""
from __future__ import annotations

import os
import sys
import tempfile
from collections import OrderedDict, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ["AST_DB"] = str(Path(tempfile.mkdtemp()) / "schedule.db")

from backend.app import catalog, config, db, tracker  # noqa: E402
from backend.app.domain import WEEKDAYS_PT  # noqa: E402


def hm(m: float) -> str:
    m = round(m)
    return f"{m // 60}h{m % 60:02d}" if m >= 60 else f"{m}min"


conn = db.connect()
db.init_schema(conn)
catalog.ensure_catalog(conn, config.catalog_path())
res = tracker.pristine_plan(conn)
titles = {c["id"]: c["title"] for c in db.rows(conn, "SELECT id, title FROM contents")}

lines = ["# Cronograma completo (plano original)", "",
         f"Gerado por `scripts/export_schedule.py` a partir de `data/catalog.json`. Aulas de **{res.days[0].date:%d/%m/%Y} a {res.lessons_end:%d/%m/%Y}**; revisões D+30 até **{res.end_date:%d/%m/%Y}**. "
         "No app, o cronograma é **adaptativo**: este é o plano de referência (dia 0).", "",
         "Legenda: 🎬 aula (APRENDER) · 🔁 revisão (REVISAR). O plano tem só aulas e revisão; prática e projetos próprios são registrados como sessões. "
         "Quizzes, testes e guias (\"-\") acompanham a aula anterior e não ocupam tempo.", ""]
week = None
for d in res.days:
    wk = d.date.isocalendar()[1]
    if wk != week:
        week = wk
        lines += ["", f"## Semana de {d.date:%d/%m}", "", "| Data | Dia | Cursos / aulas | Aulas | Revisão | Total |", "|---|---|---|---|---|---|"]
    if not d.items:
        lines.append(f"| {d.date:%d/%m} | {WEEKDAYS_PT[d.date.weekday()]} | **{'Descanso' if d.capacity == 0 else '—'}** | | | |")
        continue
    by = defaultdict(float)
    per_course: "OrderedDict[str, int]" = OrderedDict()
    for it in d.items:
        by[it.kind] += it.minutes
        if it.kind == "video":
            per_course[it.content_id] = per_course.get(it.content_id, 0) + 1
    content = [f"🎬 {titles[c]} ({n} aula{'s' if n > 1 else ''})" for c, n in per_course.items()]
    if by["review"]:
        content.append("🔁 Revisão espaçada")
    lines.append(f"| {d.date:%d/%m} | {WEEKDAYS_PT[d.date.weekday()]} | {'<br>'.join(content)} | {hm(by['video']) if by['video'] else ''} | "
                 f"{hm(by['review']) if by['review'] else ''} | **{hm(d.total)}** |")
t = res.totals
lesson_days = [d for d in res.days if any(i.kind == "video" for i in d.items)]
review_only = [d for d in res.days if d.items and not any(i.kind == "video" for i in d.items)]
rest = [d for d in res.days if d.capacity == 0 and d.date <= res.lessons_end]
lines += ["", "## Totais", "", f"- Formação (aulas, conteúdo único): **{hm(t['video'])}**", f"- Revisão: **{hm(t['review'])}**",
          f"- Tempo total de aprendizado: **{hm(sum(t.values()))}**",
          f"- Última aula: **{res.lessons_end:%d/%m/%Y}** · última revisão (D+30): **{res.end_date:%d/%m/%Y}**",
          f"- {len(lesson_days)} dias de aula · {len(review_only)} dias só com revisão · {len(rest)} dias de descanso (até a última aula)",
          f"- Média por dia de aula: **{hm(sum(d.total for d in lesson_days) / len(lesson_days))}** · maior dia: **{hm(max(d.total for d in lesson_days))}**"]
out = ROOT / "docs" / "CRONOGRAMA.md"
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"ok: {out}")
