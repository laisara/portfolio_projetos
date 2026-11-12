import { api, bar, COMP_LABEL, esc, fmtDate, hm, icon, mmss, pct, rewardToast, skeleton, toast, TYPE_LABEL } from "../core.js";
import { startFocusWith } from "../focus.js";

export default async function course(el, id) {
  el.innerHTML = skeleton(500);
  const c = await api(`/contents/${encodeURIComponent(id)}`);
  const p = c.progress;
  const next = c.modules.flatMap((m) => m.lessons).find((l) => l.required && !l.completed_on);
  const shared = c.tracks.length > 1;
  el.innerHTML = `
  <a class="btn ghost sm" href="#/catalog" style="margin-bottom:12px">${icon("chevron-left")} Formação</a>
  <div class="page-head"><div>
      <div class="row wrap" style="margin-bottom:8px"><span class="id-tag">${esc(c.id)}</span>${c.type === "projeto" ? '<span class="chip warn">projeto</span>' : ""}
        ${c.tracks.map((t) => `<span class="chip">${esc(t.title)} · #${t.position}</span>`).join("")}</div>
      <h1>${esc(c.title)}</h1>
      <p class="muted" style="margin:6px 0 0">${hm(c.duration_min)} (soma das ${c.lesson_count} aulas) · ${p.lessons_done}/${p.lessons} concluídas · <b class="num">${pct(p.pct)}</b></p>
    </div>
    <div class="row"><button class="btn" id="mark-all">${icon("circle-check")} ${p.complete ? "Desmarcar curso" : "Concluir curso"}</button>
      <button class="btn primary" id="start-next" ${next ? "" : "disabled"}>${icon("play")} Estudar próxima aula</button></div></div>

  ${shared ? `<div class="notice info" style="margin-bottom:16px">${icon("git-branch")}<div>Este curso aparece em <b>${c.tracks.length} trilhas</b> (${c.tracks.map((t) => esc(t.title)).join(", ")}). Ele existe uma vez: concluir aulas, módulos ou o curso aqui vale em todas elas.</div></div>` : ""}
  ${c.note ? `<div class="notice" style="margin-bottom:16px">${icon("triangle-alert")}<div>${esc(c.note)}</div></div>` : ""}

  <div class="grid grid-2">
    <section class="panel">
      ${c.modules.map((m) => `<div class="module">
        <div class="module-head"><h2 style="font-size:13.5px">${esc(m.title)}</h2><span class="faint num" style="font-size:12px">${m.lessons_done}/${m.lessons_required} · ${hm(m.video_total)}</span><span class="spacer"></span>
          <button class="btn ghost sm" data-module="${esc(m.id)}" data-done="${m.complete}">${m.complete ? "Desmarcar módulo" : "Concluir módulo"}</button></div>
        <div class="lessons">${m.lessons.map((l) => `<div class="lesson ${l.completed_on ? "done" : ""}" ${l.required ? "" : 'style="opacity:.6"'}>
          <button class="check" role="checkbox" aria-checked="${!!l.completed_on}" data-lesson="${esc(l.id)}" aria-label="${l.completed_on ? "Desmarcar" : "Concluir"} aula ${l.num}: ${esc(l.title)}" ${l.required ? "" : "disabled"}>${icon("check")}</button>
          <div><div class="l-title"><span class="faint num">${l.num}.</span> ${esc(l.title)}${l.kind === "quiz" ? ' <span class="chip" style="height:18px;font-size:10.5px">quiz</span>' : ""}${!l.required ? ' <span class="chip" style="height:18px;font-size:10.5px">em breve</span>' : ""}</div>
            ${l.completed_on ? `<div class="faint" style="font-size:12px">concluída em ${fmtDate(l.completed_on)}</div>` : l.watched_min ? `<div class="faint" style="font-size:12px">${hm(l.watched_min)} assistidos</div>` : ""}</div>
          <div class="row">${l.required && !l.completed_on ? `<button class="btn ghost sm icon-only" data-play='${esc(JSON.stringify({ kind: "video", ref: l.id, title: l.title, minutes: l.has_duration ? Math.max(1, l.duration_min - l.watched_min) : 0, phase: "APRENDER", detail: { course: c.title, has_duration: !!l.has_duration } }))}' aria-label="Estudar ${esc(l.title)}">${icon("play")}</button>` : ""}
            <span class="num faint" style="min-width:48px;text-align:right">${l.has_duration ? mmss(l.duration_min) : '<span class="dash">-</span>'}</span></div>
        </div>`).join("")}</div></div>`).join("")}
    </section>
    <div class="stack">
      <section class="panel"><h2 style="margin-bottom:14px">Progresso</h2>
        <div class="row" style="margin-bottom:6px">Aulas<span class="spacer"></span><span class="num">${hm(p.video_done)} / ${hm(p.video_total)}</span></div>${bar(p.pct, "", "", "Progresso do curso")}
        <hr class="divider"><dl class="kv">
          <dt>Duração oficial</dt><dd class="num"><b>${hm(c.duration_min)}</b> <span class="faint">(soma das aulas)</span></dd>
          ${c.card_min ? `<dt>Card do site</dt><dd class="num faint">${hm(c.card_min)} (só conferência)</dd>` : ""}
          <dt>Aulas sem duração</dt><dd>${p.durationless} <span class="faint">(quizzes, testes e guias: "-")</span></dd>
          <dt>No cronograma</dt><dd>${c.plan.first ? `${fmtDate(c.plan.first)} → ${fmtDate(c.plan.last)}` : p.complete ? "concluído" : "—"}</dd>
          <dt>Competências</dt><dd>${(c.competencies || []).map((x) => COMP_LABEL[x] || x).join(", ") || "—"}</dd></dl></section>
      <section class="panel"><h2 style="margin-bottom:10px">Sessões deste curso</h2>
        ${c.sessions.length ? `<div class="mini-list">${c.sessions.map((s) => `<div><span>${fmtDate(s.date)}</span><span class="faint">${TYPE_LABEL[s.type]}</span><span class="spacer"></span><span class="num">${hm(s.actual_min)}</span></div>`).join("")}</div>` : `<p class="faint">Nenhuma sessão ainda.</p>`}
      </section>
    </div>
  </div>`;

  const post = async (path, completed, label) => {
    try { const r = await api(path, { method: "POST", body: { completed } }); rewardToast(r, label); window.dispatchEvent(new Event("study:changed")); }
    catch (e) { toast(e.message, { type: "error" }); }
  };
  el.querySelectorAll("[data-lesson]").forEach((b) => b.onclick = () => { b.disabled = true; post(`/lessons/${encodeURIComponent(b.dataset.lesson)}/toggle`, b.getAttribute("aria-checked") !== "true", "Aula atualizada"); });
  el.querySelectorAll("[data-module]").forEach((b) => b.onclick = () => post(`/modules/${encodeURIComponent(b.dataset.module)}/complete`, b.dataset.done !== "true", "Módulo atualizado"));
  el.querySelector("#mark-all").onclick = () => post(`/contents/${encodeURIComponent(c.id)}/complete`, !p.complete, p.complete ? "Curso desmarcado em todas as trilhas" : "Curso concluído em todas as trilhas");
  el.querySelectorAll("[data-play]").forEach((b) => b.onclick = () => startFocusWith(JSON.parse(b.dataset.play)));
  el.querySelector("#start-next").onclick = () => next && startFocusWith({ kind: "video", ref: next.id, title: next.title, minutes: next.has_duration ? Math.max(1, next.duration_min - next.watched_min) : 0, phase: "APRENDER", detail: { course: c.title, has_duration: !!next.has_duration } });
}
