import { api, busy, esc, fmtDate, hm, icon, KIND, skeleton, toast, verify } from "../core.js";

export default async function plan(el) {
  el.innerHTML = skeleton(600);
  const p = await api("/plan/summary");
  const t = p.totals, a = p.catalog;
  const maxWeek = Math.max(...p.weeks.map((w) => w.total));
  const row = (label, val, note = "") => `<div><span>${label}</span><span class="spacer"></span><b class="num">${val}</b>${note ? `<span class="faint" style="font-size:12px;min-width:120px;text-align:right">${note}</span>` : ""}</div>`;
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">Resumo do planejamento</p><h1>${fmtDate(p.start, "full")} → ${fmtDate(p.end, "full")}</h1>
    <p class="muted" style="margin:6px 0 0">Plano original calculado pelo algoritmo · previsão atual pelo progresso real: <b>${fmtDate(p.current_end, "full")}</b></p></div>
    <button class="btn" id="recalc">${icon("refresh-cw")} Recalcular agora</button></div>

  <div class="grid grid-2">
    <section class="panel"><h2 style="margin-bottom:10px">Carga</h2>
      <div class="mini-list">
        ${row(`<span class="dot k-video" style="display:inline-block;margin-right:8px"></span>Carga de vídeo (bruta)`, hm(a.gross_min), "todas as trilhas")}
        ${row(`<span class="dot k-video" style="display:inline-block;margin-right:8px"></span>Conteúdo único`, hm(a.unique_min), `−${hm(a.gross_min - a.unique_min)} repetido`)}
        ${row(`<span class="dot k-practice" style="display:inline-block;margin-right:8px"></span>Prática estimada`, hm(t.practice), "por natureza do curso")}
        ${row(`<span class="dot k-project" style="display:inline-block;margin-right:8px"></span>Projetos (AI Agent Lab)`, hm(t.project), "9 estágios")}
        ${row(`<span class="dot k-review" style="display:inline-block;margin-right:8px"></span>Revisão`, hm(t.review), "D+1 · D+7 · D+30")}
        ${row(`<b>Carga total estimada</b>`, hm(p.total_min))}
      </div></section>
    <section class="panel"><h2 style="margin-bottom:10px">Período</h2>
      <div class="mini-list">
        ${row("Período", `${fmtDate(p.start, "full")} → ${fmtDate(p.end, "full")}`)}
        ${row("Dias de estudo", p.study_days)}
        ${row("Dias de descanso", p.rest_days, "domingos + 25/12 e 01/01")}
        ${row("Média por dia de estudo", hm(p.avg_per_study_day))}
        ${row("Dia mais longo", hm(p.max_day), "sábado de projeto")}
        ${row("Fazer ÷ assistir", `${p.doing_ratio.toFixed(2)}×`, "prática+projeto / vídeo")}
      </div>
      ${a.status !== "final" ? `<div class="notice" style="margin-top:14px">${icon("triangle-alert")}<div>${hm(a.reserve_min)} de vídeo vêm da <b>reserva</b> ${verify(true)} (62h34 − cursos visíveis). Se parte dela for curso repetido entre trilhas, a data final antecipa.</div></div>` : ""}
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
        <li><b>~2h/dia útil e 3h30 no sábado</b>: dentro da faixa sustentável por 10+ semanas; sábado concentra o AI Agent Lab.</li>
        <li><b>Prática proporcional à natureza</b>: conceitual 30%, ferramentas 40–60%, agentes/projetos 60–80%; Python introdutório só 15–25% (você já domina).</li>
        <li><b>Ciclo diário</b>: revisar (10–15 min) → aprender → construir logo após cada bloco → consolidar no Lab.</li>
        <li><b>Revisão espaçada curta</b>: D+1, D+7, D+30 viram uma única sessão diária de ~15 min (≈9% do total).</li>
        <li><b>Descanso real</b>: domingos e feriados (25/12, 01/01) vazios; 24/12 e 31/12 com meia carga.</li>
        <li><b>Terminar até 13–15/01 exigiria ~2h45 nos dias úteis e 3h45 no sábado</b> (média 2h43/dia) por 9 semanas, com as festas no meio — acima do sustentável. Optamos por aprender melhor: +12 dias.</li>
      </ul></section>
    <section class="panel"><h2 style="margin-bottom:12px">Recálculos (cronograma adaptativo)</h2>
      ${p.revisions.length ? `<table class="tbl"><thead><tr><th>Quando</th><th>Motivo</th><th class="r">Término</th></tr></thead><tbody>${p.revisions.map((r) => `<tr><td class="num faint">${esc(r.generated_at.replace("T", " ").slice(5, 16))}</td><td>${esc(r.reason)}</td><td class="r num">${fmtDate(r.end_date)}</td></tr>`).join("")}</tbody></table>` : `<p class="faint">Sem recálculos.</p>`}
      <p class="faint" style="font-size:12.5px;margin:10px 0 0">O histórico real nunca é apagado: só o planejamento de hoje em diante é refeito. Atrasou? O restante é redistribuído. Adiantou? Conteúdos futuros são antecipados.</p></section>
  </div>`;
  el.querySelector("#recalc").onclick = async (e) => {
    busy(e.currentTarget);
    try { const r = await api("/plan/recalculate", { method: "POST" }); toast(`Plano recalculado · término ${fmtDate(r.end_date, "full")}`, { type: "good" }); plan(el); }
    catch (err) { toast(err.message, { type: "error" }); busy(e.currentTarget, false); }
  };
}
