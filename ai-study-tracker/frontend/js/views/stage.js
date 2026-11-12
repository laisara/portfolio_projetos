import { api, bar, busy, esc, fmtDate, hm, icon, pct, rewardToast, skeleton, toast } from "../core.js";
import { startFocusWith } from "../focus.js";
import { STATUS, statusChip } from "./lab.js";

export default async function stage(el, id) {
  el.innerHTML = skeleton(600);
  const { stages } = await api("/lab");
  const s = stages.find((x) => x.id === id);
  if (!s) { el.innerHTML = `<div class="panel">Estágio não encontrado. <a href="#/lab">Voltar</a></div>`; return; }
  const i = stages.indexOf(s);
  el.innerHTML = `
  <a class="btn ghost sm" href="#/lab" style="margin-bottom:12px">${icon("chevron-left")} AI Agent Lab</a>
  <div class="page-head"><div><div class="row" style="margin-bottom:8px"><span class="id-tag">${s.id}</span>${statusChip(s.effective_status)}</div>
    <h1>${esc(s.title)}</h1><p class="muted" style="margin:6px 0 0">${esc(s.subtitle || "")}</p></div>
    <button class="btn primary" id="go">${icon("hammer")} Sessão de projeto</button></div>

  <div class="grid grid-2">
    <div class="stack">
      <section class="panel"><p class="eyebrow">Objetivo</p><p style="margin:0;font-size:15px;line-height:1.6">${esc(s.objective)}</p>
        <div class="row wrap" style="margin-top:14px">${s.competency_labels.map((c) => `<span class="chip accent">${esc(c)}</span>`).join("")}</div></section>
      <section class="panel"><div class="panel-head"><h2>Tarefas</h2><span class="faint">+40 XP cada</span></div>
        <div class="checklist">${s.tasks.map((t) => `<div class="${t.done_on ? "done" : ""}"><button class="check" role="checkbox" aria-checked="${!!t.done_on}" data-task="${t.id}" aria-label="${esc(t.title)}">${icon("check")}</button><span class="txt">${esc(t.title)}</span>${t.done_on ? `<span class="faint num" style="font-size:12px">${fmtDate(t.done_on)}</span>` : ""}</div>`).join("")}</div></section>
      <section class="panel"><div class="panel-head"><h2>Milestones</h2><span class="faint">+150 XP cada</span></div>
        <div class="checklist">${s.milestones.map((m) => `<div class="${m.done_on ? "done" : ""}"><button class="check" role="checkbox" aria-checked="${!!m.done_on}" data-ms="${m.id}" aria-label="${esc(m.title)}">${icon("check")}</button><span class="txt"><b>${esc(m.title)}</b></span>${icon("target", "icon icon-sm faint")}</div>`).join("")}</div>
        <p class="faint" style="font-size:12.5px;margin:10px 0 0">Concluir todos os milestones conclui o estágio (+${s.unlock_after ? 400 : 1000} XP).</p></section>
    </div>
    <div class="stack">
      <section class="panel"><h2 style="margin-bottom:12px">Status</h2>
        <div class="row" style="gap:14px;margin-bottom:14px">${bar(s.pct, "k-project", "thick")}<b class="num">${pct(s.pct)}</b></div>
        <dl class="kv"><dt>Horas</dt><dd class="num">${hm(s.worked_min)} de ${hm(s.planned_min)}</dd>
          <dt>Liberado após</dt><dd>${esc(s.unlock_title)} ${s.trigger_done ? icon("circle-check", "icon icon-sm") : ""}</dd>
          <dt>No cronograma</dt><dd>${s.plan ? `${fmtDate(s.plan.first)} → ${fmtDate(s.plan.last)} · ${hm(s.plan.m)}` : "—"}</dd></dl>
        <div class="field" style="margin-top:14px"><label for="st">Status manual</label><select id="st" class="input">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === s.status ? "selected" : ""}>${v}</option>`).join("")}</select></div>
      </section>
      <section class="panel"><p class="eyebrow">Implementação</p><p style="margin:0;line-height:1.6">${esc(s.implementation)}</p>
        <div class="field" style="margin:14px 0 0"><label for="repo">Repositório / pasta</label><input id="repo" class="input" value="${esc(s.repo_url)}" placeholder="https://github.com/... ou C:\\lab\\${s.id.toLowerCase()}" maxlength="500"></div></section>
      <section class="panel"><div class="panel-head"><h2>Notas</h2><span class="faint" id="saved" style="font-size:12px"></span></div>
        <textarea id="notes" class="input" style="min-height:180px" maxlength="20000" placeholder="Decisões, aprendizados, links, erros e como resolveu…">${esc(s.notes)}</textarea></section>
    </div>
  </div>
  <div class="row section" style="justify-content:space-between">
    ${i > 0 ? `<a class="btn ghost" href="#/lab/${stages[i - 1].id}">${icon("chevron-left")} ${esc(stages[i - 1].title)}</a>` : "<span></span>"}
    ${i < stages.length - 1 ? `<a class="btn ghost" href="#/lab/${stages[i + 1].id}">${esc(stages[i + 1].title)} ${icon("chevron-right")}</a>` : ""}</div>`;

  const toggle = (sel, path) => el.querySelectorAll(sel).forEach((b) => b.onclick = async () => {
    const on = b.getAttribute("aria-checked") !== "true";
    b.setAttribute("aria-checked", on); b.closest("div").classList.toggle("done", on); busy(b);
    try { const r = await api(path(b), { method: "POST" }); rewardToast(r, on ? "Concluído" : "Desmarcado"); window.dispatchEvent(new Event("study:changed")); }
    catch (e) { b.setAttribute("aria-checked", !on); busy(b, false); toast(e.message, { type: "error" }); }
  });
  toggle("[data-task]", (b) => `/lab/tasks/${b.dataset.task}/toggle`);
  toggle("[data-ms]", (b) => `/lab/milestones/${b.dataset.ms}/toggle`);
  const patch = async (body, quiet) => {
    try { const r = await api(`/lab/stages/${s.id}`, { method: "PATCH", body }); if (!quiet) rewardToast(r, "Status atualizado"); el.querySelector("#saved").textContent = "salvo"; return r; }
    catch (e) { toast(e.message, { type: "error" }); }
  };
  el.querySelector("#st").onchange = async (e) => { await patch({ status: e.target.value }); window.dispatchEvent(new Event("study:changed")); };
  let timer;
  const autosave = (field) => (e) => { el.querySelector("#saved").textContent = "salvando…"; clearTimeout(timer); timer = setTimeout(() => patch({ [field]: e.target.value }, true), 700); };
  el.querySelector("#notes").oninput = autosave("notes");
  el.querySelector("#repo").oninput = autosave("repo_url");
  el.querySelector("#go").onclick = () => startFocusWith({ kind: "project", ref: s.id, title: `AI Agent Lab · ${s.title}`, minutes: Math.min(90, Math.max(25, s.planned_min - s.worked_min)), phase: "CONSOLIDAR" });
}
