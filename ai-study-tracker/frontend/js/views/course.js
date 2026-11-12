import { api, bar, esc, fmtDate, hm, icon, pct, rewardToast, skeleton, toast, TYPE_LABEL, verify } from "../core.js";
import { startFocusWith } from "../focus.js";

export default async function course(el, id) {
  el.innerHTML = skeleton(500);
  const c = await api(`/contents/${encodeURIComponent(id)}`);
  const p = c.progress, conf = c.confidence || {};
  const unit = c.modules[0]?.lessons[0];
  const courseLevel = !c.lessons_known;
  const nextPractice = c.modules.find((m) => m.practice_done < m.practice_planned);
  el.innerHTML = `
  <a class="btn ghost sm" href="#/catalog" style="margin-bottom:12px">${icon("chevron-left")} Formação</a>
  <div class="page-head"><div>
      <div class="row wrap" style="margin-bottom:8px"><span class="id-tag">${esc(c.id)}</span>
        ${c.appearances.map((a) => `<span class="chip">print #${a.position}</span>`).join("")}<span class="verify">TRILHA: VERIFICAR</span></div>
      <h1>${esc(c.title)}</h1>
      <p class="muted" style="margin:6px 0 0">${c.instructor ? esc(c.instructor) + " · " : ""}${hm(c.duration_min)} de vídeo (duração real do print)${c.lesson_count ? ` · ${c.lesson_count} aulas` : ""}</p>
    </div>
    <button class="btn primary" id="start-next">${icon("play")} Estudar agora</button></div>

  <div class="grid grid-2">
    <section class="panel">
      <div class="panel-head"><h2>Conteúdo</h2><span class="faint num">${pct(p.pct)}</span></div>
      ${courseLevel ? `<div class="notice" style="margin-bottom:12px">${icon("triangle-alert")}<div>Módulos e aulas deste curso <span class="verify">NÃO IDENTIFICADO</span> nos prints${c.lesson_count ? ` (só se sabe que são ${c.lesson_count} aulas)` : ""}. O progresso é medido por tempo assistido do curso inteiro.</div></div>` : ""}
      ${c.modules.map((m) => `${c.lessons_known ? `<div class="eyebrow" style="margin-top:14px">${esc(m.title)}</div>` : ""}
        ${m.lessons.map((l) => `<div class="lesson ${l.completed_on ? "done" : ""}">
          <button class="check" role="checkbox" aria-checked="${!!l.completed_on}" data-lesson="${esc(l.id)}" aria-label="${l.completed_on ? "Desmarcar" : "Concluir"} ${esc(l.title)}">${icon("check")}</button>
          <div><div class="l-title">${courseLevel ? "Curso completo (vídeo)" : esc(l.title)}</div>
            <div style="margin:6px 0 2px;max-width:300px">${bar(Math.min(1, l.completed_on ? 1 : l.watched_min / l.duration_min), "k-video", "thin")}</div>
            <div class="faint" style="font-size:12px">${l.completed_on ? `concluído em ${fmtDate(l.completed_on)}` : `${hm(l.watched_min)} de ${hm(l.duration_min)} assistidos`}</div></div>
          <div class="row"><span class="num faint">${hm(l.duration_min)}</span></div></div>`).join("")}
        ${m.practice_planned ? `<div class="lesson" style="grid-template-columns:20px 1fr auto"><span class="dot k-practice" style="margin-left:6px"></span>
          <div><div class="l-title">Prática (estimativa do sistema)</div><div class="faint" style="font-size:12px">${esc(c.nature_info.action || "")}</div></div>
          <div class="row"><span class="num faint">${hm(m.practice_done)} / ${hm(m.practice_planned)}</span></div></div>` : ""}`).join("")}
    </section>
    <div class="stack">
      <section class="panel"><h2 style="margin-bottom:14px">Duração real × prática estimada</h2>
        <dl class="kv" style="grid-template-columns:150px 1fr">
          <dt>Duração real</dt><dd class="num"><b>${hm(c.duration_min)}</b> <span class="chip good" style="height:20px;font-size:11px">CONFIRMADO</span></dd>
          <dt>Prática estimada</dt><dd class="num"><b>${hm(p.practice_total)}</b> (${Math.round(c.practice_ratio_effective * 100)}% do vídeo) <span class="chip" style="height:20px;font-size:11px">ESTIMATIVA</span></dd>
          <dt>Natureza</dt><dd>${esc(c.nature)} → ${esc(c.nature_info.phase || "")}</dd>
          <dt>No cronograma</dt><dd>${c.plan.first ? `${fmtDate(c.plan.first)} → ${fmtDate(c.plan.last)}` : p.pct >= 1 ? "concluído" : "—"}</dd>
          ${c.overlap_note ? `<dt>Atenção</dt><dd>${esc(c.overlap_note)}</dd>` : ""}
          ${c.lab_stages.length ? `<dt>Libera no Lab</dt><dd>${c.lab_stages.map((s) => `<a href="#/lab/${s.id}" class="chip accent">${s.id} · ${esc(s.title)}</a>`).join(" ")}</dd>` : ""}
        </dl><p class="faint" style="font-size:12px;margin:12px 0 0">O percentual de prática é ajustável em Ajustes → Prática por curso.</p></section>
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
      rewardToast(r, completed ? "Concluído" : "Desmarcado");
      window.dispatchEvent(new Event("study:changed"));
    } catch (e) { b.setAttribute("aria-checked", !completed); b.disabled = false; toast(e.message, { type: "error" }); }
  });
  const done = p.pct >= 1;
  const btn = el.querySelector("#start-next");
  btn.disabled = done;
  btn.onclick = () => {
    if (unit && !unit.completed_on) {
      const rest = Math.max(5, unit.duration_min - unit.watched_min);
      startFocusWith({ kind: "video", ref: unit.id, title: c.title, minutes: Math.min(45, rest), phase: "APRENDER", detail: { course_level: courseLevel, block: 1, of: Math.ceil(rest / 45) } });
    } else if (nextPractice) {
      startFocusWith({ kind: "practice", ref: nextPractice.id, title: `Prática · ${c.title}`, minutes: Math.max(5, nextPractice.practice_planned - nextPractice.practice_done), phase: c.nature_info.phase });
    }
  };
}
