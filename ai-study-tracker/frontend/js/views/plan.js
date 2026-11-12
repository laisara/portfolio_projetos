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
    <section class="panel"><h2 style="margin-bottom:10px">Carga planejada (conteúdo identificado)</h2>
      <div class="mini-list">
        ${row(`<span class="dot k-video" style="display:inline-block;margin-right:8px"></span>FORMAÇÃO (vídeo, único)`, hm(t.video), "duração real dos prints")}
        ${row(`<span class="dot k-practice" style="display:inline-block;margin-right:8px"></span>PRÁTICA`, hm(t.practice), "estimativa configurável")}
        ${row(`<span class="dot k-project" style="display:inline-block;margin-right:8px"></span>PROJETOS (AI Agent Lab)`, hm(t.project), "9 estágios")}
        ${row(`<span class="dot k-review" style="display:inline-block;margin-right:8px"></span>REVISÃO`, hm(t.review), "D+1 · D+7 · D+30")}
        ${row(`<b>TEMPO TOTAL DE APRENDIZADO</b>`, `<span style="color:var(--green-hover)">${hm(p.total_min)}</span>`)}
      </div>
      <p class="faint" style="font-size:12.5px;margin:12px 0 0">A formação (vídeo) é só ${Math.round(t.video / p.total_min * 100)}% do tempo total: o resto é prática, projetos e revisão.</p></section>
    <section class="panel"><h2 style="margin-bottom:10px">Período e ritmo</h2>
      <div class="mini-list">
        ${row("Data inicial", fmtDate(p.start, "full"))}
        ${row("Data final (conteúdo identificado)", fmtDate(p.end, "full"))}
        ${row("Dias de estudo", p.study_days)}
        ${row("Dias de descanso", p.rest_days, "domingos + 25/12 e 01/01")}
        ${row("Média por dia de estudo", hm(p.avg_per_study_day))}
        ${row("Maior carga diária", hm(p.max_day), "sábado de projeto")}
        ${row("Prática+projeto ÷ vídeo", `${p.doing_ratio.toFixed(2)}×`)}
      </div>
      <div class="notice" style="margin-top:14px">${icon("triangle-alert")}<div>Declarado ${hm(a.declared_min)} · identificado ${hm(a.identified_gross_min)} (único ${hm(a.identified_unique_min)}). Os <b>${hm(a.unidentified_min)}</b> <span class="verify">NÃO IDENTIFICADO</span> não estão no cronograma: quando forem identificados, a data final se desloca.</div></div>
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
        <li><b>~2h nos dias úteis e até 3h30 no sábado</b> (sua faixa: 1h30–2h30 e 2h30–3h30): sustentável por semanas; o sábado concentra o AI Agent Lab.</li>
        <li><b>Prática é uma estimativa</b> proporcional ao tipo de curso (15%–80% do vídeo), editável em Ajustes. Python introdutório recebe pouca prática porque você já domina.</li>
        <li><b>Ciclo diário</b>: revisar (curto) → aprender → construir logo após cada sessão de vídeo → consolidar no Lab.</li>
        <li><b>Revisão D+1/D+7/D+30</b> agrupada em uma sessão diária de poucos minutos.</li>
        <li><b>Descanso real</b>: domingos e feriados (25/12, 01/01) vazios; 24/12 e 31/12 com meia carga.</li>
        <li><b>A data final não é 63h ÷ dias</b>: sai do algoritmo, que respeita capacidade diária, descanso, prática e revisão. Ela só cobre o conteúdo identificado.</li>
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
