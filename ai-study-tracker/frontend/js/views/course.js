import { api, bar, esc, fmtDate, hm, icon, pct, rewardToast, skeleton, toast, TYPE_LABEL, verify } from "../core.js";
import { startFocusWith } from "../focus.js";

export default async function course(el, id) {
  el.innerHTML = skeleton(500);
  const c = await api(`/contents/${encodeURIComponent(id)}`);
  const p = c.progress;
  el.innerHTML = `
  <a class="btn ghost sm" href="#/catalog" style="margin-bottom:12px">${icon("chevron-left")} Formação</a>
  <div class="page-head"><div>
      <div class="row wrap" style="margin-bottom:8px"><span class="id-tag">${esc(c.id)}</span>${c.tracks.map((t) => `<span class="chip">${esc(t.title)} · #${t.position}</span>`).join("")}${c.intro ? '<span class="chip">introdutório</span>' : ""}</div>
      <h1>${esc(c.title)}</h1>
      <p class="muted" style="margin:6px 0 0">${c.instructor ? esc(c.instructor) + " · " : ""}${hm(c.duration_min)} de vídeo${c.lesson_count ? ` · ${c.lesson_count} aulas` : ""}</p>
    </div>
    <button class="btn primary" id="start-next">${icon("play")} Estudar próximo bloco</button></div>

  <div class="grid grid-2">
    <section class="panel">
      <div class="panel-head"><h2>Aulas</h2><span class="faint num">${p.lessons_done}/${p.lessons}</span></div>
      ${!c.lessons_known ? `<div class="notice" style="margin-bottom:12px">${icon("triangle-alert")}<div>Lista de aulas não visível nos prints ${verify(true)}. A duração total (${hm(c.duration_min)}) é real; ela foi dividida em blocos de estudo de ~40 min para o planejamento. Marque cada bloco ao assistir a parte correspondente.</div></div>` : ""}
      ${c.modules.map((m) => `
        ${c.lessons_known ? `<div class="eyebrow" style="margin-top:14px">${esc(m.title)} ${verify(m.verify)}</div>` : ""}
        ${m.lessons.map((l) => `<div class="lesson ${l.completed_on ? "done" : ""}">
          <button class="check" role="checkbox" aria-checked="${!!l.completed_on}" data-lesson="${esc(l.id)}" aria-label="Concluir ${esc(l.title)}">${icon("check")}</button>
          <div><div class="l-title">${esc(l.title)} ${l.verify && c.lessons_known ? verify(true) : ""}</div>
            <div class="faint" style="font-size:12px">${l.completed_on ? `concluída em ${fmtDate(l.completed_on)}` : l.watched_min ? `${hm(l.watched_min)} assistidos` : `<span class="mono">${esc(l.id)}</span>`}</div></div>
          <div class="row"><span class="num faint">${hm(l.duration_min)}</span>${!l.completed_on ? `<button class="btn ghost sm icon-only" data-play='${esc(JSON.stringify({ kind: "video", ref: l.id, title: l.title, minutes: l.duration_min, phase: "APRENDER" }))}' aria-label="Estudar ${esc(l.title)}">${icon("play")}</button>` : ""}</div>
        </div>`).join("")}
        ${m.practice_planned ? `<div class="lesson" style="grid-template-columns:20px 1fr auto"><span class="dot k-practice" style="margin-left:6px"></span>
          <div><div class="l-title">Prática do ${c.lessons_known ? "módulo" : "bloco"}</div><div class="faint" style="font-size:12px">${esc(c.nature_info.action || "")}</div></div>
          <div class="row"><span class="num faint">${hm(m.practice_done)} / ${hm(m.practice_planned)}</span><button class="btn ghost sm icon-only" data-play='${esc(JSON.stringify({ kind: "practice", ref: m.id, title: `Prática · ${c.title}${m.title ? " · " + m.title : ""}`, minutes: Math.max(5, m.practice_planned - m.practice_done), phase: c.nature_info.phase }))}' aria-label="Praticar">${icon("hammer")}</button></div></div>` : ""}
      `).join("")}
    </section>
    <div class="stack">
      <section class="panel"><h2 style="margin-bottom:14px">Progresso</h2>
        <div class="row" style="margin-bottom:6px"><span class="dot k-video"></span>Vídeo<span class="spacer"></span><span class="num">${hm(p.video_done)} / ${hm(p.video_total)}</span></div>${bar(p.video_total ? p.video_done / p.video_total : 0, "k-video")}
        <div class="row" style="margin:14px 0 6px"><span class="dot k-practice"></span>Prática<span class="spacer"></span><span class="num">${hm(p.practice_done)} / ${hm(p.practice_total)}</span></div>${bar(p.practice_total ? p.practice_done / p.practice_total : 0, "k-practice")}
        <hr class="divider"><dl class="kv">
          <dt>Natureza</dt><dd>${esc(c.nature)} → ${esc(c.nature_info.phase || "")}</dd>
          <dt>Prática planejada</dt><dd>${Math.round(c.practice_ratio * 100)}% do vídeo</dd>
          <dt>No cronograma</dt><dd>${c.plan.first ? `${fmtDate(c.plan.first)} → ${fmtDate(c.plan.last)}` : p.pct >= 1 ? "concluído" : "—"}</dd>
          ${c.overlap_note ? `<dt>Atenção</dt><dd>${esc(c.overlap_note)}</dd>` : ""}
          ${c.lab_stages.length ? `<dt>Libera no Lab</dt><dd>${c.lab_stages.map((s) => `<a href="#/lab/${s.id}" class="chip accent">${s.id} · ${esc(s.title)}</a>`).join(" ")}</dd>` : ""}
        </dl></section>
      <section class="panel"><h2 style="margin-bottom:10px">Sessões deste curso</h2>
        ${c.sessions.length ? `<div class="mini-list">${c.sessions.map((s) => `<div><span>${fmtDate(s.date)}</span><span class="faint">${TYPE_LABEL[s.type]}</span><span class="spacer"></span><span class="num">${hm(s.actual_min)}</span></div>`).join("")}</div>` : `<p class="faint">Nenhuma sessão ainda.</p>`}
      </section>
    </div>
  </div>`;

  el.querySelectorAll("[data-lesson]").forEach((b) => b.onclick = async () => {
    const completed = b.getAttribute("aria-checked") !== "true";
    b.setAttribute("aria-checked", completed); b.disabled = true;
    try {
      const r = await api(`/lessons/${encodeURIComponent(b.dataset.lesson)}/toggle`, { method: "POST", body: { completed } });
      rewardToast(r, completed ? "Aula concluída" : "Aula desmarcada");
      window.dispatchEvent(new Event("study:changed"));
    } catch (e) { b.setAttribute("aria-checked", !completed); b.disabled = false; toast(e.message, { type: "error" }); }
  });
  el.querySelectorAll("[data-play]").forEach((b) => b.onclick = () => startFocusWith(JSON.parse(b.dataset.play)));
  const next = el.querySelector("[data-play]");
  el.querySelector("#start-next").onclick = () => next ? next.click() : toast("Curso concluído!", { type: "good" });
  if (!next) el.querySelector("#start-next").disabled = true;
}
