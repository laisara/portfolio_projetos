import { api, bar, empty, esc, fmtDate, hm, hms, icon, KIND, mmss, pct, phaseTag, rewardToast, skeleton, toast } from "../core.js";
import { completeItem, startFocusWith } from "../focus.js";

const fmtH = (m) => hm(m, { zero: "0h", compact: true });

/** Linha de atividade (usada no calendário). */
export function taskRow(it, { startable = true } = {}) {
  const k = KIND[it.kind] || {};
  const d = it.detail || {};
  const extra = it.kind === "review" ? (d.reviews || []).map((r) => `D+${r.interval}`).join(" · ") : d.course ? esc(d.course) : "";
  const noDur = it.kind === "video" && d.has_duration === false;
  return `<div class="task ${k.cls}"><span class="rail"></span>
    <div><div class="t-title">${esc(it.title)}</div><div class="t-meta">${phaseTag(it.kind, it.phase)}<span class="num">${noDur ? '<span class="dash">-</span>' : hm(it.minutes)}</span>${extra ? `<span>${extra}</span>` : ""}</div></div>
    ${startable ? `<button class="btn sm" data-start='${esc(JSON.stringify(it))}' aria-label="Iniciar: ${esc(it.title)}">${icon("play")} Iniciar</button>` : ""}</div>`;
}
export function bindStart(root) {
  root.querySelectorAll("[data-start]").forEach((b) => b.onclick = () => startFocusWith(JSON.parse(b.dataset.start)));
}

function todayRow(it) {
  const d = it.detail || {};
  const k = KIND[it.kind] || {};
  const noDur = it.kind === "video" && d.has_duration === false;
  const label = it.kind === "video" ? `${d.num ? `Aula ${d.num} — ` : ""}${esc(it.title)}` : it.kind === "review" ? "Revisões espaçadas" : esc(it.title);
  const t = it.kind === "video" ? (noDur ? '<span class="dash">-</span>' : mmss(it.minutes)) : hm(it.minutes);
  return `<div class="today-row ${k.cls}">
    <button class="check" role="checkbox" aria-checked="false" data-complete='${esc(JSON.stringify(it))}' aria-label="Concluir: ${label}">${icon("check")}</button>
    <div style="min-width:0"><div class="t-title">${label}</div><div class="t-meta">${phaseTag(it.kind, it.phase)}${d.course ? `<span>${esc(d.course)}</span>` : ""}</div></div>
    <span class="num faint">${t}</span></div>`;
}

export default async function dashboard(el) {
  el.innerHTML = `${skeleton(40)}<div style="height:16px"></div>${skeleton(220)}<div style="height:16px"></div>${skeleton(200)}`;
  const d = await api("/dashboard");
  const t = d.today, L = d.load, sn = d.study_now, w = d.week, rt = d.reviews_today;
  const planned = t.items.reduce((a, i) => a + i.minutes, 0);
  const doneMin = L.done.formation;
  const lessonsLeft = d.lessons.total - d.lessons.done;
  const dt = new Date(t.date + "T12:00:00");
  const dayLabel = dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }).toUpperCase();

  const hero = sn ? `<section class="hero-study glass" aria-label="Estudar agora">
      <div class="eyebrow" style="margin:0 0 10px">${sn.today ? "ESTUDAR AGORA" : `PRÓXIMO ESTUDO · ${esc(fmtDate(t.next_day?.date))}`}</div>
      <div class="hs-course">${esc(sn.course || (sn.kind === "review" ? "Revisões" : ""))}</div>
      ${sn.track ? `<div class="hs-track">Trilha ${sn.track_ord} · ${esc(sn.track)}</div>` : ""}
      <h2 class="hs-title">${sn.kind === "video" && sn.num ? `<span class="faint">Aula ${sn.num} ·</span> ` : ""}${esc(sn.title)}</h2>
      <div class="hs-time num">${sn.kind === "video" && sn.has_duration && sn.duration_min ? mmss(sn.duration_min) : sn.minutes > 0 ? hm(sn.minutes) : '<span class="dash">-</span>'}</div>
      ${sn.status ? `<div class="hs-status"><span class="chip ${sn.continuing ? "accent" : ""}">${esc(sn.status)}</span></div>` : ""}
      <button class="btn xl primary" id="hs-start">${icon("play")} ${sn.continuing ? "Continuar estudo" : "Começar estudo"}</button>
    </section>`
    : `<section class="hero-study glass">${t.rest ? empty("coffee", "Dia de descanso", "Hoje não há aula nem revisão. Descansar também é estudar.") : empty("circle-check", "Tudo em dia", "Nada planejado por agora.")}</section>`;

  const rows = t.items.filter((i) => i.kind !== "review" || true);
  const shown = rows.slice(0, 8);
  el.innerHTML = `
  <div class="page-head">
    <div><p class="eyebrow">${esc(d.greeting)} · ${esc(t.weekday)}</p><h1>Continue de onde você parou.</h1></div>
    <div class="row wrap">
      <span class="chip" title="Sequência de dias de estudo">${icon("flame")} ${d.streak.current} dia${d.streak.current === 1 ? "" : "s"}</span>
      <a class="chip accent" href="#/achievements">${icon("zap", "icon icon-sm")} ${d.xp.toLocaleString("pt-BR")} XP · ${esc(d.level.name)}</a>
      ${rt.pending ? `<a class="chip warn" href="#/reviews">${icon("repeat", "icon icon-sm")} ${rt.pending} revisão(ões) hoje</a>` : ""}
    </div>
  </div>

  ${hero}

  <div class="grid grid-2 section">
    <section class="panel glass" aria-labelledby="h-today">
      <div class="panel-head"><div><h2 id="h-today">Hoje — ${dayLabel}</h2><div class="sub">${t.items.length ? `${t.items.length} atividades` : "sem atividades planejadas"}</div></div>
        <div class="day-total"><b class="num">${hm(planned, { compact: true })}</b><span class="faint">${t.done_min ? `· ${hm(t.done_min, { compact: true })} feitos` : "planejado"}</span></div></div>
      ${shown.length ? shown.map(todayRow).join("") + (rows.length > shown.length ? `<p class="faint" style="font-size:12.5px;margin:10px 0 0">+ ${rows.length - shown.length} atividades depois destas</p>` : "") : ""}
      ${t.sessions.length ? `<hr class="divider"><div class="eyebrow">Feito hoje</div>${t.sessions.map((s) => `<div class="today-row done"><span class="check" aria-hidden="true" data-on="true">${icon("check")}</span><div class="t-title">${esc(s.title)}</div><span class="num faint">${hm(s.actual_min)}</span></div>`).join("")}` : ""}
      ${t.items.length ? `<button class="btn lg primary" id="tp-start" style="margin-top:16px;width:100%">${icon("play")} Começar sessão</button>` : ""}
    </section>

    <section class="panel glass" aria-labelledby="h-prog">
      <div class="panel-head"><h2 id="h-prog">Progresso da formação</h2><span class="chip">${d.courses.done}/${d.courses.total} cursos</span></div>
      <div class="eyebrow" style="margin:0">FORMAÇÃO</div>
      <div class="big-num num">${hms(doneMin)} <small>concluídas</small></div>
      <div class="faint" style="font-size:13px;margin-bottom:12px">de ${hms(L.planned.formation)} · faltam ${hms(d.video.remaining)} · ${lessonsLeft} aulas restantes</div>
      ${bar(d.overall, "", "thick", "Progresso da formação")}
      <div class="row" style="justify-content:space-between;margin:8px 0 14px"><b class="num" style="font-size:22px">${Math.round(d.overall * 100)}%</b><span class="faint" style="font-size:12.5px">${d.lessons.done}/${d.lessons.total} aulas</span></div>
      <div class="loadgrid">
        <div><span class="faint">FORMAÇÃO</span><b class="num">${hms(L.planned.formation)}</b></div>
        <div><span class="faint">PRÁTICA</span><b class="num">+ ${fmtH(L.planned.practice)}</b></div>
        <div><span class="faint">PROJETOS</span><b class="num">+ ${fmtH(L.planned.project)}</b></div>
        <div><span class="faint">REVISÃO</span><b class="num">+ ${fmtH(L.planned.review)}</b></div>
      </div>
      <div class="total-row"><span>TOTAL DE APRENDIZAGEM</span><b class="num">${hms(L.planned.total)}</b></div>
      <div class="faint" style="font-size:12px;margin-top:6px">Prática, projetos e revisão são estimativas do planejador; a duração da formação é só a soma das aulas.</div>
    </section>
  </div>

  <div class="grid grid-2 section">
    <section class="panel glass" aria-labelledby="h-week">
      <div class="panel-head"><h2 id="h-week">Semana</h2><span class="faint num" style="font-size:12.5px">${fmtDate(w.start)} – ${fmtDate(w.end)}</span></div>
      <div class="week3"><div><b class="num">${w.sessions}</b><span class="faint">sessões concluídas</span></div><div><b class="num">${hm(w.studied_min, { compact: true, zero: "0h" })}</b><span class="faint">tempo estudado</span></div><div><b class="num">${Math.round(w.pct * 100)}%</b><span class="faint">do plano da semana</span></div></div>
      ${bar(w.pct, "", "", "Progresso semanal")}
    </section>
    <section class="panel glass" aria-labelledby="h-xp">
      <div class="panel-head"><h2 id="h-xp">Nível e XP</h2><a class="btn ghost sm" href="#/achievements">Progresso ${icon("chevron-right")}</a></div>
      <div class="row" style="gap:14px;align-items:baseline"><b style="font-size:24px;color:var(--green-hover)">${esc(d.level.name)}</b><span class="faint num">${d.xp.toLocaleString("pt-BR")} XP</span></div>
      <div style="margin:10px 0 6px">${bar(d.level_pct, "", "", "Progresso do nível")}</div>
      <div class="faint" style="font-size:12.5px">${d.next_level ? `faltam ${(d.next_level.xp - d.xp).toLocaleString("pt-BR")} XP para ${esc(d.next_level.name)}` : "nível máximo"} · sequência ${d.streak.current} dia${d.streak.current === 1 ? "" : "s"} (melhor ${d.streak.best})</div>
    </section>
  </div>

  <section class="section" aria-labelledby="h-tracks">
    <div class="section-head"><span class="label" id="h-tracks">Trilhas</span><a class="btn ghost sm" href="#/catalog">Ver todas ${icon("chevron-right")}</a></div>
    <div class="panel glass flush">${d.tracks.map((tr) => `<a class="track-row" href="#/catalog" onclick="sessionStorage.setItem('ast:track','${tr.id}')">
      <span class="track-num">${tr.ord}</span><div style="min-width:0"><div style="font-weight:500">${esc(tr.title)}</div><div class="faint" style="font-size:12.5px">${tr.courses_done}/${tr.courses.length} cursos · ${tr.lessons_done}/${tr.lessons} aulas</div></div>
      <div class="bar-cell">${bar(tr.pct, "", "", tr.title)}</div><span class="pct num">${pct(tr.pct)}</span></a>`).join("")}</div>
  </section>`;

  el.querySelector("#hs-start")?.addEventListener("click", () => startFocusWith(sn.item));
  el.querySelector("#tp-start")?.addEventListener("click", () => startFocusWith((t.items.find((i) => i.kind !== "review") || t.items[0])));
  el.querySelectorAll("[data-complete]").forEach((b) => b.onclick = async () => {
    const it = JSON.parse(b.dataset.complete);
    b.setAttribute("aria-checked", "true"); b.disabled = true;
    try { const r = await completeItem(it); rewardToast(r, "Concluída"); window.dispatchEvent(new Event("study:changed")); }
    catch (e) { b.setAttribute("aria-checked", "false"); b.disabled = false; toast(e.message, { type: "error" }); }
  });
}
