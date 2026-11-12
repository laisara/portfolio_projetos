import { api, busy, esc, fmtDate, hm, icon, KIND, skeleton, toast } from "../core.js";

export default async function plan(el) {
  el.innerHTML = skeleton(600);
  const p = await api("/plan/summary");
  const t = p.totals, a = p.catalog;
  const maxWeek = Math.max(...p.weeks.map((w) => w.total));
  const row = (label, val, note = "") => `<div><span>${label}</span><span class="spacer"></span><b class="num">${val}</b>${note ? `<span class="faint" style="font-size:12px;min-width:150px;text-align:right">${note}</span>` : ""}</div>`;
  const dot = (k) => `<span class="dot ${KIND[k].cls}" style="display:inline-block;margin-right:8px"></span>`;
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">Resumo do planejamento</p><h1>${fmtDate(p.start, "full")} → ${fmtDate(p.lessons_end, "full")}</h1>
    <p class="muted" style="margin:6px 0 0">Última aula em ${fmtDate(p.lessons_end, "full")}; as revisões D+30 das últimas aulas seguem até <b>${fmtDate(p.end, "full")}</b> · previsão atual pelo progresso real: aulas até <b>${fmtDate(p.current_lessons_end, "full")}</b>, revisões até <b>${fmtDate(p.current_end, "full")}</b></p></div>
    <button class="btn" id="recalc">${icon("refresh-cw")} Recalcular agora</button></div>

  <div class="grid grid-2">
    <section class="panel"><h2 style="margin-bottom:10px">Carga planejada</h2>
      <div class="mini-list">
        ${row(`${dot("video")}FORMAÇÃO (soma das aulas)`, hm(a.unique_min), `${a.courses} cursos · ${a.lessons} aulas`)}
        ${row(`${dot("practice")}PRÁTICA`, "+ " + hm(t.practice), "estimada")}
        ${row(`${dot("project")}PROJETOS`, "+ " + hm(t.project), "lista de projetos")}
        ${row(`${dot("review")}REVISÃO (D+1 · D+7 · D+30)`, "+ " + hm(t.review), "estimada")}
        ${row(`<b>TOTAL DE APRENDIZAGEM</b>`, `<span style="color:var(--green-hover)">${hm(a.unique_min + t.practice + t.project + t.review)}</span>`, "formação + prática + projetos + revisão")}
      </div>
      <div class="notice info" style="margin-top:14px">${icon("info")}<div>A <b>formação</b> é só a soma das aulas (${hm(a.unique_min)}). Prática, projetos e revisão são tempo <b>adicional estimado</b> pelo planejador. A carga bruta das 8 trilhas é ${hm(a.gross_min)}; o conteúdo repetido (${hm(a.duplicate_min)}) conta uma vez.</div></div>
    </section>
    <section class="panel"><h2 style="margin-bottom:10px">Período e ritmo</h2>
      <div class="mini-list">
        ${row("Data inicial", fmtDate(p.start, "full"))}
        ${row("Última aula", fmtDate(p.lessons_end, "full"))}
        ${row("Última atividade (sem revisão)", fmtDate(p.work_end, "full"))}
        ${row("Última revisão (D+30)", fmtDate(p.end, "full"))}
        ${row("Dias de estudo", p.study_days)}
        ${row("Dias só com revisão", p.review_only_days, "cauda D+7/D+30, poucos minutos")}
        ${row("Dias de descanso", p.rest_days, "domingos e feriados, até a última aula")}
        ${row("Média por dia de estudo", hm(p.avg_per_study_day))}
        ${row("Maior carga diária", hm(p.max_day), "sábado (projeto)")}
      </div>
    </section>
  </div>

  <section class="panel section"><div class="panel-head"><h2>Carga semanal planejada</h2>
    <div class="legend">${["video", "practice", "project", "review"].map((k) => `<span><span class="dot ${KIND[k].cls}"></span>${KIND[k].label}</span>`).join("")}</div></div>
    <div class="weekchart" style="margin-bottom:26px">${p.weeks.map((w) => `<div class="col" title="Semana de ${fmtDate(w.week)}: ${hm(w.total)}">
      ${["review", "project", "practice", "video"].map((k) => w[k] ? `<i class="${KIND[k].cls}" style="height:${(w[k] / maxWeek) * 100}%"></i>` : "").join("")}<span>${fmtDate(w.week)}</span></div>`).join("")}</div>
    <div class="row wrap faint" style="font-size:12.5px;gap:16px">${Object.entries(p.avg_by_weekday).map(([d, m]) => `<span>${d.slice(0, 3)}: <b class="num" style="color:var(--text-2)">${hm(m, { compact: true })}</b></span>`).join("")}<span>Dom: descanso</span></div>
  </section>

  <div class="grid grid-2 section">
    <section class="panel"><h2 style="margin-bottom:12px">Por que essa distribuição</h2>
      <ul class="muted" style="margin:0;padding-left:18px;line-height:1.7;font-size:13.5px">
        <li><b>1h45–2h15 nos dias úteis e até 3h30 no sábado</b>, com domingo livre: ritmo sustentável por semanas.</li>
        <li><b>Ordem da plataforma</b>: trilhas na ordem, cursos na ordem de cada trilha. Curso repetido aparece uma vez.</li>
        <li><b>Aulas inteiras</b>: cada aula aparece uma única vez no plano, sem ser cortada entre dois dias.</li>
        <li><b>Prática depois de cada curso e projetos aos sábados</b>: o tempo é estimado e editável; a prática diminui nos cursos de programação básica, que você já domina.</li>
        <li><b>Revisão espaçada curta</b>: D+1, D+7 e D+30 agrupados em uma sessão diária de poucos minutos.</li>
        <li><b>Quizzes, testes e guias</b> ("-") acompanham a aula anterior e não ocupam tempo no plano.</li>
        <li><b>A data final não é carga ÷ dias</b>: sai do algoritmo (capacidade por dia, descanso, feriados e revisão). Se você estudar mais ou menos, o futuro é recalculado e o histórico é preservado.</li>
      </ul></section>
    <section class="panel"><h2 style="margin-bottom:12px">Recálculos (cronograma adaptativo)</h2>
      ${p.revisions.length ? `<table class="tbl"><thead><tr><th>Quando</th><th>Motivo</th><th class="r">Término</th></tr></thead><tbody>${p.revisions.map((r) => `<tr><td class="num faint">${esc(r.generated_at.replace("T", " ").slice(5, 16))}</td><td>${esc(r.reason)}</td><td class="r num">${fmtDate(r.end_date)}</td></tr>`).join("")}</tbody></table>` : `<p class="faint">Sem recálculos.</p>`}
      <p class="faint" style="font-size:12.5px;margin:10px 0 0">Atrasou? O restante é redistribuído. Adiantou? Aulas futuras são antecipadas.</p></section>
  </div>`;
  el.querySelector("#recalc").onclick = async (e) => {
    busy(e.currentTarget);
    try { const r = await api("/plan/recalculate", { method: "POST" }); toast(`Plano recalculado · término ${fmtDate(r.end_date, "full")}`, { type: "good" }); plan(el); }
    catch (err) { toast(err.message, { type: "error" }); busy(e.currentTarget, false); }
  };
}
