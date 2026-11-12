import { api, bar, esc, fmtDate, hm, icon, KIND, pct, phaseTag, segbar, skeleton, TYPE_KIND, TYPE_LABEL, verify, empty } from "../core.js";
import { startFocusWith } from "../focus.js";

export function taskRow(it, { startable = true } = {}) {
  const k = KIND[it.kind] || {};
  const extra = it.kind === "review" ? `${(it.detail?.reviews || []).map((r) => `D+${r.interval}`).join(" · ")}`
    : it.kind === "practice" ? esc(it.detail?.action || "")
    : it.kind === "video" && it.detail?.of > 1 ? `bloco ${it.detail.block}/${it.detail.of} do curso` : "";
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

const fmtH = (m) => hm(m, { zero: "0h", compact: true });
export default async function dashboard(el) {
  el.innerHTML = `${skeleton(40)}<div style="height:16px"></div>${skeleton(180)}<div style="height:16px"></div>${skeleton(260)}`;
  const d = await api("/dashboard");
  const t = d.today, cat = d.catalog, L = d.load;
  const plannedToday = t.items.reduce((a, i) => a + i.minutes, 0);
  const shift = d.plan_end && d.pristine_end ? Math.round((new Date(d.plan_end) - new Date(d.pristine_end)) / 86400000) : 0;
  const rt = d.reviews_today;

  const todayBlock = t.items.length
    ? t.items.map((i) => taskRow(i)).join("")
    : t.rest ? empty("coffee", "Dia de descanso", "Sem aulas, exercícios, revisão ou projeto hoje.")
    : t.done_min > 0 ? empty("circle-check", "Plano de hoje concluído", "O restante foi redistribuído para os próximos dias.")
    : empty("calendar-days", "Nada planejado hoje", t.next_day ? `Próximo estudo: ${t.next_day.weekday}, ${fmtDate(t.next_day.date)}.` : "");

  const loadCell = (label, k, cls) => `<div><div class="stat-label"><span class="dot ${cls}"></span>${label}</div>
    <div class="stat-value num">${fmtH(L.planned[k])}</div><div class="faint num" style="font-size:12px">${fmtH(L.done[k])} feitos</div></div>`;

  el.innerHTML = `
  <div class="page-head">
    <div><p class="eyebrow">${esc(fmtDate(t.date, "long"))}</p><h1>AI Agent Engineering</h1></div>
    <div class="row wrap">
      <span class="chip" title="Sequência de dias de estudo">${icon("flame")} ${d.streak.current} dia${d.streak.current === 1 ? "" : "s"}</span>
      <span class="chip ${shift > 0 ? "warn" : shift < 0 ? "good" : ""}" title="Fim do conteúdo identificado, recalculado pelo progresso real">${icon("target")} Fim do conteúdo identificado ${fmtDate(d.plan_end, "full")}${shift ? ` (${shift > 0 ? "+" : ""}${shift}d)` : ""}</span>
      <button class="btn primary" id="go-focus">${icon("timer")} Iniciar sessão</button>
    </div>
  </div>
  <div class="notice" style="margin-bottom:20px">${icon("triangle-alert")}<div>O cronograma cobre <b>${hm(cat.identified_unique_min)}</b> de <b>${hm(cat.declared_min)}</b> declaradas (${pct(cat.identified_pct)}). Os outros <b>${hm(cat.unidentified_min)}</b> <span class="verify">[NÃO IDENTIFICADO]</span> não aparecem nos prints e <b>não estão agendados</b>. <a href="#/catalog" style="color:var(--text);text-decoration:underline">Auditar carga</a></div></div>

  <section class="panel">
    <div class="hero">
      <div><p class="eyebrow">Progresso geral</p><div class="big num">${Math.round(d.overall * 100)}<small>%</small></div>
        <div class="faint" style="font-size:12.5px;margin-top:4px">do conteúdo identificado + prática + AI Agent Lab</div></div>
      <div style="text-align:right" class="muted">
        <div style="font-size:12.5px">Nível</div>
        <a href="#/achievements" style="font-size:18px;font-weight:600;color:var(--green-hover)">${esc(d.level.name)}</a>
        <div class="faint num" style="font-size:12.5px">${d.xp.toLocaleString("pt-BR")} XP${d.next_level ? ` · faltam ${(d.next_level.xp - d.xp).toLocaleString("pt-BR")} para ${esc(d.next_level.name)}` : ""}</div>
      </div>
    </div>
    <div style="margin-top:18px">${segbar(d.overall)}</div>
    <div class="hero-meta">
      <div><b class="num">${d.lessons.done} / ${d.lessons.total}</b>cursos concluídos</div>
      <div><b class="num">${d.lessons.total - d.lessons.done}</b>cursos restantes</div>
      <div><b class="num">${fmtH(L.done.total)}</b>tempo estudado</div>
      <div><b class="num">${rt.pending}</b>reviews pendentes hoje</div>
    </div>
  </section>

  <section class="section" aria-labelledby="h-load">
    <div class="section-head"><span class="label" id="h-load">Carga de aprendizagem (planejada · feita)</span></div>
    <div class="panel flush"><div class="statstrip">
      ${loadCell("FORMAÇÃO", "formation", "k-video")}${loadCell("PRÁTICA", "practice", "k-practice")}
      ${loadCell("PROJETOS", "project", "k-project")}${loadCell("REVISÃO", "review", "k-review")}
      <div style="grid-column: span 2"><div class="stat-label">${icon("clock", "icon icon-sm")} TEMPO TOTAL DE APRENDIZADO</div>
        <div class="stat-value num" style="color:var(--green-hover)">${fmtH(L.planned.total)}</div><div class="faint num" style="font-size:12px">${fmtH(L.done.total)} feitos · formação ${fmtH(L.planned.formation)} é só ${pct(L.planned.formation / L.planned.total)}</div></div>
    </div></div>
  </section>

  <div class="grid grid-2 section">
    <section class="panel" aria-labelledby="h-today">
      <div class="panel-head">
        <div><h2 id="h-today">${t.items.length ? "O que estudar hoje" : "Hoje"}</h2><div class="sub">Revisar → aprender → construir → consolidar</div></div>
        <div class="day-total"><b class="num">${hm(plannedToday, { compact: true })}</b><span class="faint">${t.done_min ? `· ${hm(t.done_min, { compact: true })} feitos` : "planejado"}</span></div>
      </div>
      ${todayBlock}
      ${t.sessions.length ? `<hr class="divider"><div class="eyebrow">Feito hoje</div>${t.sessions.map((s) => `
        <div class="task done ${KIND[TYPE_KIND[s.type]]?.cls || "k-other"}"><span class="rail"></span><div><div class="t-title">${esc(s.title)}</div>
        <div class="t-meta"><span>${TYPE_LABEL[s.type]}</span><span class="num">${hm(s.actual_min)}</span>${s.status === "partial" ? '<span class="chip warn">parcial</span>' : ""}</div></div>${icon("circle-check")}</div>`).join("")}` : ""}
      ${!t.items.length && t.next_day ? `<hr class="divider"><div class="eyebrow">Próximo: ${esc(t.next_day.weekday)}, ${fmtDate(t.next_day.date)}</div>${t.next_day.items.slice(0, 4).map((i) => taskRow(i)).join("")}` : ""}
    </section>

    <div class="stack">
      <section class="panel" aria-labelledby="h-rev">
        <div class="panel-head"><h2 id="h-rev">Reviews de hoje: <span class="num" style="color:var(--green-hover)">${rt.pending}</span></h2>${rt.done ? `<span class="chip good">${rt.done} feita(s)</span>` : ""}</div>
        ${d.upcoming_reviews.length ? `<div class="mini-list">${d.upcoming_reviews.slice(0, 5).map((r) => `
          <div><span class="dot k-review"></span><span>D+${r.interval} · conteúdo de ${fmtDate(r.learned_on)}</span><span class="spacer"></span><span class="faint num">${fmtDate(r.planned_for || r.due)} · ${hm(r.minutes)}</span></div>`).join("")}</div>`
          : empty("repeat", "Sem revisões ainda", "Elas aparecem conforme você conclui conteúdo (D+1, D+7, D+30).")}
      </section>
      <section class="panel" aria-labelledby="h-lab">
        <div class="panel-head"><h2 id="h-lab">Próximo projeto · AI Agent Lab</h2><a class="btn ghost sm" href="#/lab">Abrir ${icon("chevron-right")}</a></div>
        ${d.next_stage ? `<a href="#/lab/${d.next_stage.id}" style="display:block">
          <div class="row"><span class="id-tag">${d.next_stage.id}</span><b>${esc(d.next_stage.title)}</b><span class="spacer"></span><span class="faint num">${pct(d.next_stage.pct)}</span></div>
          <div style="margin:10px 0 8px">${bar(d.next_stage.pct)}</div>
          <div class="faint" style="font-size:12.5px">${d.next_stage.status === "locked" ? `Libera após: ${esc(d.next_stage.unlock_title)}` : "Disponível — próximo passo prático."}</div></a>` : empty("flask-conical", "Laboratório concluído")}
      </section>
    </div>
  </div>

  <section class="section" aria-labelledby="h-tracks">
    <div class="section-head"><span class="label" id="h-tracks">8 trilhas · ${cat.tracks_confirmed} confirmada(s)</span><a class="btn ghost sm" href="#/catalog">Formação ${icon("chevron-right")}</a></div>
    <div class="panel flush">
      ${d.tracks.map((tr) => tr.to_confirm
        ? `<div class="track-row" style="grid-template-columns:28px 1fr auto"><span class="track-num" style="border-style:dashed">${tr.ord}</span><div style="color:var(--text-3)">${esc(tr.title)}</div><span class="verify">A CONFIRMAR</span></div>`
        : `<a class="track-row" href="#/catalog"><span class="track-num">${tr.ord}</span><div><div style="font-weight:500">${esc(tr.title)}${tr.name ? " · " + esc(tr.name) : ""}</div></div><div class="bar-cell">${bar(tr.pct)}</div><span class="pct num">${pct(tr.pct)}</span><span class="meta num">${tr.lessons_done}/${tr.lessons}</span></a>`).join("")}
    </div>
    <p class="faint" style="font-size:12.5px;margin:8px 0 0">Os prints não mostram a que trilha cada curso pertence nem os nomes das trilhas — por isso nada foi associado. O progresso por curso está em Formação.</p>
  </section>`;
  el.querySelector("#go-focus").onclick = () => import("../focus.js").then((m) => m.openFocusPicker());
  bindStart(el);
}
