import { api, bar, dur, esc, fmtDate, hm, hours, icon, KIND, pct, phaseTag, segbar, skeleton, TYPE_KIND, TYPE_LABEL, empty } from "../core.js";
import { startFocusWith } from "../focus.js";

export function taskRow(it, { startable = true } = {}) {
  const k = KIND[it.kind] || {};
  const d = it.detail || {};
  const extra = it.kind === "review" ? (d.reviews || []).map((r) => `D+${r.interval}`).join(" · ")
    : d.course ? esc(d.course) : "";
  const noDur = it.kind === "video" && d.has_duration === false;
  return `<div class="task ${k.cls}">
    <span class="rail"></span>
    <div><div class="t-title">${esc(it.title)}</div>
      <div class="t-meta">${phaseTag(it.kind, it.phase)}<span class="num">${noDur ? '<span class="dash">-</span>' : hm(it.minutes)}</span>${extra ? `<span>${extra}</span>` : ""}</div></div>
    ${startable ? `<button class="btn sm" data-start='${esc(JSON.stringify(it))}' aria-label="Iniciar: ${esc(it.title)}">${icon("play")} Iniciar</button>` : ""}
  </div>`;
}
export function bindStart(root) {
  root.querySelectorAll("[data-start]").forEach((b) => b.onclick = () => startFocusWith(JSON.parse(b.dataset.start)));
}

const fmtH = (m) => hm(m, { zero: "0h", compact: true });

/** Agrupa as aulas do dia por curso: "Curso X — 5 aulas · 1h20". */
function todayGroups(items) {
  const groups = [];
  for (const it of items) {
    if (it.kind !== "video") { groups.push({ review: it }); continue; }
    const last = groups[groups.length - 1];
    if (last && last.course === it.content_id) last.items.push(it);
    else groups.push({ course: it.content_id, name: it.detail?.course || it.title, items: [it] });
  }
  return groups;
}

export default async function dashboard(el) {
  el.innerHTML = `${skeleton(40)}<div style="height:16px"></div>${skeleton(180)}<div style="height:16px"></div>${skeleton(260)}`;
  const d = await api("/dashboard");
  const t = d.today, cat = d.catalog, L = d.load;
  const plannedToday = t.items.reduce((a, i) => a + i.minutes, 0);
  const shift = d.plan_end && d.pristine_end ? Math.round((new Date(d.plan_end) - new Date(d.pristine_end)) / 86400000) : 0;
  const rt = d.reviews_today;

  const groups = todayGroups(t.items);
  const todayBlock = t.items.length
    ? groups.map((g) => g.review ? taskRow(g.review)
      : `<div class="eyebrow" style="margin:14px 0 4px">${esc(g.name)} · ${g.items.length} aula${g.items.length > 1 ? "s" : ""} · ${hm(g.items.reduce((a, i) => a + i.minutes, 0))}</div>${g.items.map((i) => taskRow(i)).join("")}`).join("")
    : t.rest ? empty("coffee", "Dia de descanso", "Sem aulas nem revisão hoje. Descansar também é estudar.")
    : t.done_min > 0 ? empty("circle-check", "Plano de hoje concluído", "O restante foi redistribuído para os próximos dias.")
    : empty("calendar-days", "Nada planejado hoje", t.next_day ? `Próximo estudo: ${t.next_day.weekday}, ${fmtDate(t.next_day.date)}.` : "");

  el.innerHTML = `
  <div class="page-head">
    <div><p class="eyebrow">${esc(fmtDate(t.date, "long"))}</p><h1>Formação Engenheiro de Agentes de IA</h1></div>
    <div class="row wrap">
      <span class="chip" title="Sequência de dias de estudo">${icon("flame")} ${d.streak.current} dia${d.streak.current === 1 ? "" : "s"}</span>
      <span class="chip ${shift > 0 ? "warn" : shift < 0 ? "good" : ""}" title="Previsão recalculada pelo progresso real">${icon("target")} Aulas até ${fmtDate(d.lessons_end, "full")} · revisões até ${fmtDate(d.plan_end, "full")}${shift ? ` (${shift > 0 ? "+" : ""}${shift}d)` : ""}</span>
      <button class="btn primary" id="go-focus">${icon("timer")} Iniciar sessão</button>
    </div>
  </div>

  <section class="panel">
    <div class="hero">
      <div><p class="eyebrow">Progresso geral</p><div class="big num">${Math.round(d.overall * 100)}<small>%</small></div>
        <div class="faint" style="font-size:12.5px;margin-top:4px">do conteúdo único da formação (cursos repetidos contam uma vez)</div></div>
      <div style="text-align:right" class="muted">
        <div style="font-size:12.5px">Nível</div>
        <a href="#/achievements" style="font-size:18px;font-weight:600;color:var(--green-hover)">${esc(d.level.name)}</a>
        <div class="faint num" style="font-size:12.5px">${d.xp.toLocaleString("pt-BR")} XP${d.next_level ? ` · faltam ${(d.next_level.xp - d.xp).toLocaleString("pt-BR")} para ${esc(d.next_level.name)}` : ""}</div>
      </div>
    </div>
    <div style="margin-top:18px">${segbar(d.overall)}</div>
    <div class="hero-meta">
      <div><b class="num">${d.courses.done} / ${d.courses.total}</b>cursos concluídos</div>
      <div><b class="num">${d.lessons.done} / ${d.lessons.total}</b>aulas concluídas</div>
      <div><b class="num">${d.lessons.total - d.lessons.done}</b>aulas restantes</div>
      <div><b class="num">${fmtH(d.video.done)} / ${fmtH(d.video.total)}</b>de aulas assistidas</div>
    </div>
  </section>

  <section class="panel flush section" aria-label="Indicadores">
    <div class="statstrip">
      <div><div class="stat-label"><span class="dot k-video"></span>FORMAÇÃO</div><div class="stat-value num">${fmtH(cat.unique_min)}</div><div class="faint num" style="font-size:12px">conteúdo único · ${fmtH(L.done.formation)} estudadas</div></div>
      <div><div class="stat-label"><span class="dot k-review"></span>REVISÃO</div><div class="stat-value num">${fmtH(L.planned.review)}</div><div class="faint num" style="font-size:12px">planejada · ${fmtH(L.done.review)} feitas</div></div>
      <div><div class="stat-label">${icon("clock", "icon icon-sm")} TEMPO TOTAL DE APRENDIZADO</div><div class="stat-value num" style="color:var(--green-hover)">${fmtH(L.planned.total)}</div><div class="faint num" style="font-size:12px">aulas + revisão</div></div>
      <div><div class="stat-label"><span class="dot k-practice"></span>PRÁTICA</div><div class="stat-value num">${fmtH(L.done.practice)}</div><div class="faint" style="font-size:12px">registrada por você</div></div>
      <div><div class="stat-label"><span class="dot k-project"></span>PROJETOS</div><div class="stat-value num">${fmtH(L.done.project)}</div><div class="faint" style="font-size:12px">registrados por você</div></div>
      <div><div class="stat-label">${icon("clock", "icon icon-sm")} Total estudado</div><div class="stat-value num">${fmtH(L.done.total)}</div><div class="faint" style="font-size:12px">todas as sessões</div></div>
    </div>
  </section>

  <div class="grid grid-2 section">
    <section class="panel" aria-labelledby="h-today">
      <div class="panel-head">
        <div><h2 id="h-today">${t.items.length ? "O que estudar hoje" : "Hoje"}</h2><div class="sub">Revisar → aprender, na ordem da formação</div></div>
        <div class="day-total"><b class="num">${hm(plannedToday, { compact: true })}</b><span class="faint">${t.done_min ? `· ${hm(t.done_min, { compact: true })} feitos` : "planejado"}</span></div>
      </div>
      ${todayBlock}
      ${t.sessions.length ? `<hr class="divider"><div class="eyebrow">Feito hoje</div>${t.sessions.map((s) => `
        <div class="task done ${KIND[TYPE_KIND[s.type]]?.cls || "k-other"}"><span class="rail"></span><div><div class="t-title">${esc(s.title)}</div>
        <div class="t-meta"><span>${TYPE_LABEL[s.type]}</span><span class="num">${hm(s.actual_min)}</span>${s.status === "partial" ? '<span class="chip warn">parcial</span>' : ""}</div></div>${icon("circle-check")}</div>`).join("")}` : ""}
      ${!t.items.length && t.next_day ? `<hr class="divider"><div class="eyebrow">Próximo: ${esc(t.next_day.weekday)}, ${fmtDate(t.next_day.date)}</div>${t.next_day.items.slice(0, 4).map((i) => taskRow(i)).join("")}` : ""}
    </section>

    <section class="panel" aria-labelledby="h-rev">
      <div class="panel-head"><h2 id="h-rev">Reviews de hoje: <span class="num" style="color:var(--green-hover)">${rt.pending}</span></h2>${rt.done ? `<span class="chip good">${rt.done} feita(s)</span>` : ""}</div>
      ${d.upcoming_reviews.length ? `<div class="mini-list">${d.upcoming_reviews.slice(0, 6).map((r) => `
        <div><span class="dot k-review"></span><span>D+${r.interval} · conteúdo de ${fmtDate(r.learned_on)}</span><span class="spacer"></span><span class="faint num">${fmtDate(r.planned_for || r.due)} · ${hm(r.minutes)}</span></div>`).join("")}</div>`
        : empty("repeat", "Sem revisões ainda", "Elas aparecem conforme você conclui aulas (D+1, D+7, D+30).")}
    </section>
  </div>

  <section class="section" aria-labelledby="h-tracks">
    <div class="section-head"><span class="label" id="h-tracks">Progresso por trilha</span><a class="btn ghost sm" href="#/catalog">Formação ${icon("chevron-right")}</a></div>
    <div class="panel flush">
      ${["Produtividade pessoal com IA", "Criando sistemas profissionais de inteligência artificial"].map((g) => `
        <div class="eyebrow" style="padding:12px 18px 0;margin:0">${esc(g)}</div>
        ${d.tracks.filter((tr) => tr.group_name === g).map((tr) => `<a class="track-row" href="#/catalog" onclick="sessionStorage.setItem('ast:track','${tr.id}')">
          <span class="track-num">${tr.ord}</span>
          <div style="min-width:0"><div style="font-weight:500">${esc(tr.title)}</div><div class="faint" style="font-size:12.5px">${tr.courses.length} cursos · ${tr.lessons_done}/${tr.lessons} aulas</div></div>
          <div class="bar-cell">${bar(tr.pct, "", "", tr.title)}</div>
          <span class="pct num">${pct(tr.pct)}</span>
          <span class="meta num">${hours(tr.video_total)}</span>
        </a>`).join("")}`).join("")}
    </div>
  </section>`;
  el.querySelector("#go-focus").onclick = () => import("../focus.js").then((m) => m.openFocusPicker());
  bindStart(el);
}
