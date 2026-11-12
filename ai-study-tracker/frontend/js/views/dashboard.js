import { api, bar, esc, fmtDate, hm, hours, icon, KIND, pct, phaseTag, segbar, skeleton, TYPE_KIND, TYPE_LABEL, verify, empty } from "../core.js";
import { startFocusWith } from "../focus.js";

export function taskRow(it, { startable = true } = {}) {
  const k = KIND[it.kind] || {};
  const extra = it.kind === "review" ? `${(it.detail?.reviews || []).map((r) => `D+${r.interval}`).join(" · ")}`
    : it.kind === "practice" ? esc(it.detail?.action || "")
    : it.kind === "video" && it.detail?.verify ? verify(true, "AULAS A MAPEAR") : "";
  return `<div class="task ${k.cls}">
    <span class="rail"></span>
    <div><div class="t-title">${esc(it.title)}</div>
      <div class="t-meta">${phaseTag(it.kind, it.phase)}<span class="num">${hm(it.minutes)}</span>${extra ? `<span>${extra}</span>` : ""}</div></div>
    ${startable ? `<button class="btn sm" data-start='${esc(JSON.stringify(it))}' aria-label="Iniciar: ${esc(it.title)}">${icon("play")} Iniciar</button>` : ""}
  </div>`;
}
export function bindStart(root) {
  root.querySelectorAll("[data-start]").forEach((b) => b.onclick = () => startFocusWith(JSON.parse(b.dataset.start)));
}

export default async function dashboard(el) {
  el.innerHTML = `${skeleton(40)}<div style="height:16px"></div>${skeleton(180)}<div style="height:16px"></div>${skeleton(260)}`;
  const d = await api("/dashboard");
  const t = d.today;
  const mt = d.minutes_by_type;
  const totalMin = Object.values(mt).reduce((a, b) => a + b, 0);
  const plannedToday = t.items.reduce((a, i) => a + i.minutes, 0);
  const shift = d.plan_end && d.pristine_end ? Math.round((new Date(d.plan_end) - new Date(d.pristine_end)) / 86400000) : 0;

  const todayBlock = t.items.length
    ? `${t.items.map((i) => taskRow(i)).join("")}`
    : t.rest ? empty("coffee", "Dia de descanso", "Sem aulas, exercícios, revisão ou projeto hoje. Recarregue.")
    : t.done_min > 0 ? empty("circle-check", "Plano de hoje concluído", "Ótimo trabalho. O restante foi redistribuído para os próximos dias.")
    : empty("calendar-days", "Nada planejado hoje", t.next_day ? `Próximo estudo: ${t.next_day.weekday}, ${fmtDate(t.next_day.date)}.` : "");

  el.innerHTML = `
  <div class="page-head">
    <div><p class="eyebrow">${esc(fmtDate(t.date, "long"))}</p><h1>AI Agent Engineering</h1></div>
    <div class="row wrap">
      <span class="chip" title="Sequência de dias de estudo">${icon("flame")} ${d.streak.current} dia${d.streak.current === 1 ? "" : "s"}</span>
      <span class="chip ${shift > 0 ? "warn" : shift < 0 ? "good" : ""}" title="Previsão de término (recalculada pelo progresso real)">${icon("target")} Término ${fmtDate(d.plan_end, "full")}${shift ? ` (${shift > 0 ? "+" : ""}${shift}d)` : ""}</span>
      <button class="btn primary" id="go-focus">${icon("timer")} Iniciar sessão</button>
    </div>
  </div>
  ${d.catalog_status !== "final" ? `<div class="notice" style="margin-bottom:20px">${icon("triangle-alert")}<div>Catálogo parcial: parte da formação ainda não aparece nos prints (marcado como <span class="verify">[VERIFICAR]</span>). O cronograma já reserva esse tempo e se recalcula quando o catálogo for completado. <a href="#/catalog" style="color:var(--text);text-decoration:underline">Ver formação</a></div></div>` : ""}

  <section class="panel">
    <div class="hero">
      <div>
        <p class="eyebrow">Progresso geral</p>
        <div class="big num">${Math.round(d.overall * 100)}<small>%</small></div>
      </div>
      <div style="text-align:right" class="muted">
        <div style="font-size:12.5px">Nível</div>
        <a href="#/achievements" style="font-size:18px;font-weight:600;color:var(--text)">${esc(d.level.name)}</a>
        <div class="faint num" style="font-size:12.5px">${d.xp.toLocaleString("pt-BR")} XP${d.next_level ? ` · faltam ${(d.next_level.xp - d.xp).toLocaleString("pt-BR")} para ${esc(d.next_level.name)}` : ""}</div>
      </div>
    </div>
    <div style="margin-top:18px">${segbar(d.overall)}</div>
    <div class="hero-meta">
      <div><b class="num">${hours(d.video.done)} / ${hours(d.video.total)}</b>vídeo</div>
      <div><b class="num">${hours(d.practice.done)} / ${hours(d.practice.total)}</b>prática planejada</div>
      <div><b class="num">${hours(d.project.done)} / ${hours(d.project.total)}</b>AI Agent Lab</div>
      <div><b class="num">${d.lessons.done} / ${d.lessons.total}</b>aulas e blocos</div>
    </div>
  </section>

  <section class="panel flush section" aria-label="Indicadores">
    <div class="statstrip">
      ${[["VIDEO", "Vídeo"], ["PRACTICE", "Prática"], ["PROJECT", "Projeto"], ["REVIEW", "Revisão"]].map(([k, l]) =>
        `<div><div class="stat-label"><span class="dot ${KIND[TYPE_KIND[k]].cls}"></span>${l}</div><div class="stat-value num">${hm(mt[k], { zero: "0h", compact: true })}</div></div>`).join("")}
      <div><div class="stat-label">${icon("clock", "icon icon-sm")} Total estudado</div><div class="stat-value num">${hm(totalMin, { zero: "0h", compact: true })}</div></div>
      <div><div class="stat-label">${icon("list-checks", "icon icon-sm")} Restantes</div><div class="stat-value num">${d.lessons.total - d.lessons.done} <small>aulas/blocos</small></div></div>
    </div>
  </section>

  <div class="grid grid-2 section">
    <section class="panel" aria-labelledby="h-today">
      <div class="panel-head">
        <div><h2 id="h-today">${t.items.length ? "Próximo estudo · hoje" : "Hoje"}</h2><div class="sub">Ciclo: revisar → aprender → construir → consolidar</div></div>
        <div class="day-total"><b class="num">${hm(plannedToday, { compact: true })}</b><span class="faint">${t.done_min ? `· ${hm(t.done_min, { compact: true })} feitos` : "planejado"}</span></div>
      </div>
      ${todayBlock}
      ${t.sessions.length ? `<hr class="divider"><div class="eyebrow">Feito hoje</div>${t.sessions.map((s) => `
        <div class="task done ${KIND[TYPE_KIND[s.type]]?.cls || "k-other"}"><span class="rail"></span><div><div class="t-title">${esc(s.title)}</div>
        <div class="t-meta"><span>${TYPE_LABEL[s.type]}</span><span class="num">${hm(s.actual_min)}</span>${s.status === "partial" ? '<span class="chip warn">parcial</span>' : ""}</div></div>${icon("circle-check")}</div>`).join("")}` : ""}
      ${!t.items.length && t.next_day ? `<hr class="divider"><div class="eyebrow">Próximo: ${esc(t.next_day.weekday)}, ${fmtDate(t.next_day.date)}</div>${t.next_day.items.slice(0, 4).map((i) => taskRow(i, { startable: true })).join("")}` : ""}
    </section>

    <div class="stack">
      <section class="panel" aria-labelledby="h-rev">
        <div class="panel-head"><h2 id="h-rev">Próximas revisões</h2>${d.reviews_due ? `<span class="chip k-review" style="color:var(--c-review)">${d.reviews_due} vencida(s)</span>` : ""}</div>
        ${d.upcoming_reviews.length ? `<div class="mini-list">${d.upcoming_reviews.slice(0, 5).map((r) => `
          <div><span class="dot k-review"></span><span>D+${r.interval} · conteúdo de ${fmtDate(r.learned_on)}</span><span class="spacer"></span><span class="faint num">${fmtDate(r.planned_for || r.due)} · ${hm(r.minutes)}</span></div>`).join("")}</div>`
          : empty("repeat", "Sem revisões ainda", "Elas aparecem conforme você conclui aulas (D+1, D+7, D+30).")}
      </section>
      <section class="panel" aria-labelledby="h-lab">
        <div class="panel-head"><h2 id="h-lab">AI Agent Lab</h2><a class="btn ghost sm" href="#/lab">Abrir ${icon("chevron-right")}</a></div>
        ${d.next_stage ? `<a href="#/lab/${d.next_stage.id}" style="display:block">
          <div class="row"><span class="id-tag">${d.next_stage.id}</span><b>${esc(d.next_stage.title)}</b><span class="spacer"></span><span class="faint num">${pct(d.next_stage.pct)}</span></div>
          <div style="margin:10px 0 8px">${bar(d.next_stage.pct, "k-project")}</div>
          <div class="faint" style="font-size:12.5px">${d.next_stage.status === "locked" ? `Libera após: ${esc(d.next_stage.unlock_title)}` : "Disponível — próximo passo prático."}</div></a>` : empty("flask-conical", "Laboratório concluído")}
      </section>
    </div>
  </div>

  <section class="section" aria-labelledby="h-tracks">
    <div class="section-head"><span class="label" id="h-tracks">Progresso por trilha</span><a class="btn ghost sm" href="#/catalog">Formação ${icon("chevron-right")}</a></div>
    <div class="panel flush">
      ${d.tracks.map((tr) => `<a class="track-row" href="#/catalog?track=${tr.id}" onclick="location.hash='#/catalog';sessionStorage.setItem('ast:track','${tr.id}');return false;">
        <span class="track-num">${tr.ord}</span>
        <div style="min-width:0"><div style="font-weight:500">${esc(tr.title)} ${verify(tr.verify, "NOME")}</div><div class="faint" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(tr.theme || "")}</div></div>
        <div class="bar-cell">${bar(tr.pct)}</div>
        <span class="pct num">${pct(tr.pct)}</span>
        <span class="meta num">${hours(tr.video_total)} · ${tr.lessons_done}/${tr.lessons}</span>
      </a>`).join("")}
    </div>
  </section>`;
  el.querySelector("#go-focus").onclick = () => import("../focus.js").then((m) => m.openFocusPicker());
  bindStart(el);
}
