import { api, busy, closeLayer, confirmDialog, esc, fmtDate, hm, icon, KIND, openLayer, rewardToast, skeleton, toast, TYPE_KIND, TYPE_LABEL, empty } from "../core.js";
import { openFocusPicker } from "../focus.js";

const STATUS = { done: "Concluída", partial: "Parcial", missed: "Não realizada" };

async function sessionForm(session) {
  const [health, cat] = await Promise.all([api("/health"), api("/catalog")]);
  const seq = cat.courses.sort((a, b) => a.study_ord - b.study_ord);
  const box = openLayer(`
    <div class="modal-head"><div><p class="eyebrow">${session ? "Editar" : "Registrar"} sessão</p><h2>${session ? esc(session.title) : "Sessão de estudo"}</h2></div>
      <button class="btn ghost icon-only" data-close aria-label="Fechar">${icon("x")}</button></div>
    <form id="sf" novalidate>
      ${session ? "" : `<div class="field-row">
        <div class="field"><label for="sf-date">Data</label><input id="sf-date" class="input" type="date" required value="${health.today}" max="${health.today}"></div>
        <div class="field"><label for="sf-type">Tipo</label><select id="sf-type" class="input">${Object.entries(TYPE_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div></div>
      <div class="field" id="sf-target-wrap"><label for="sf-target">Curso (só para sessões de aula)</label><select id="sf-target" class="input"></select></div>`}
      <div class="field"><label for="sf-title">Título</label><input id="sf-title" class="input" required maxlength="200" value="${esc(session?.title || "")}"></div>
      <div class="field-row">
        ${session ? "" : `<div class="field"><label for="sf-plan">Tempo planejado (min)</label><input id="sf-plan" class="input num" type="number" min="0" max="720" value="0"></div>`}
        <div class="field"><label for="sf-actual">Tempo realizado (min)</label><input id="sf-actual" class="input num" type="number" min="0" max="720" required value="${session?.actual_min ?? ""}"><span class="err" id="sf-err" role="alert"></span></div>
        ${session ? `<div class="field"><label for="sf-status">Status</label><select id="sf-status" class="input">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${session.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>` : ""}
      </div>
      ${session ? "" : `<div class="field"><label for="sf-status">Status</label><select id="sf-status" class="input">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
      <label class="row" id="sf-complete-wrap" style="margin-bottom:14px;cursor:pointer"><input type="checkbox" id="sf-complete" checked> Marcar o curso inteiro como concluído (vale em todas as trilhas)</label>`}
      <div class="field"><label for="sf-notes">Observações</label><textarea id="sf-notes" class="input" maxlength="4000">${esc(session?.notes || "")}</textarea></div>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-close>Cancelar</button><button class="btn primary" id="sf-save">${icon("check")} Salvar</button></div>
    </form>`, { label: "Registrar sessão" });

  const typeSel = box.querySelector("#sf-type"), target = box.querySelector("#sf-target");
  const fillTargets = () => {
    if (!typeSel) return;
    const t = typeSel.value;
    let opts = [`<option value="">— livre (só horas) —</option>`];
    if (t === "VIDEO") opts = opts.concat(seq.filter((c) => !c.complete).map((c) => `<option value="content:${c.id}">${esc(c.title)}</option>`));
    target.innerHTML = opts.join("");
    box.querySelector("#sf-complete-wrap").style.display = t === "VIDEO" ? "" : "none";
    box.querySelector("#sf-complete").checked = false;
  };
  if (typeSel) {
    typeSel.onchange = fillTargets; fillTargets();
    target.onchange = () => { const o = target.selectedOptions[0]; if (target.value && !box.querySelector("#sf-title").value) box.querySelector("#sf-title").value = o.textContent.split(" · ").slice(1).join(" · "); };
  }
  box.querySelector("#sf").onsubmit = async (e) => {
    e.preventDefault();
    const btn = box.querySelector("#sf-save");
    const titleEl = box.querySelector("#sf-title"), actEl = box.querySelector("#sf-actual");
    const status = box.querySelector("#sf-status").value;
    const actual = +actEl.value;
    titleEl.setAttribute("aria-invalid", !titleEl.value.trim()); actEl.setAttribute("aria-invalid", false);
    if (!titleEl.value.trim()) { titleEl.focus(); return; }
    if (status !== "missed" && !(actual > 0 && actual <= 720)) { actEl.setAttribute("aria-invalid", true); box.querySelector("#sf-err").textContent = "Informe um tempo entre 1 e 720 min."; actEl.focus(); return; }
    busy(btn);
    try {
      let r;
      if (session) {
        r = await api(`/sessions/${session.id}`, { method: "PATCH", body: { title: titleEl.value.trim(), actual_min: actual, status, notes: box.querySelector("#sf-notes").value } });
      } else {
        const [kind, id] = (target.value || ":").split(":");
        let target_kind = "free", target_id = null, complete_lessons = [];
        if (kind === "content") {
          const c = await api(`/contents/${encodeURIComponent(id)}`);
          const lessons = c.modules.flatMap((m) => m.lessons).filter((l) => l.required && !l.completed_on);
          target_kind = "lesson"; target_id = lessons[0]?.id || null;
          if (box.querySelector("#sf-complete").checked) complete_lessons = lessons.map((l) => l.id);
        }
        r = await api("/sessions", { method: "POST", body: {
          date: box.querySelector("#sf-date").value, type: typeSel.value, target_kind, target_id, title: titleEl.value.trim(),
          planned_min: +box.querySelector("#sf-plan").value || 0, actual_min: actual, status, notes: box.querySelector("#sf-notes").value, complete_lessons } });
      }
      closeLayer();
      rewardToast(r, session ? "Sessão atualizada" : "Sessão registrada");
      window.dispatchEvent(new Event("study:changed"));
    } catch (err) { busy(btn, false); toast(err.message, { type: "error" }); }
  };
}

export default async function sessions(el) {
  el.innerHTML = skeleton(400);
  const d = await api("/sessions?limit=300");
  const byDate = {};
  d.sessions.forEach((s) => (byDate[s.date] ||= []).push(s));
  const tot = Object.fromEntries(d.totals.map((t) => [t.type, t]));
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">Histórico real</p><h1>Sessões</h1></div>
    <div class="row"><button class="btn" id="add">${icon("plus")} Registrar sessão</button><button class="btn primary" id="start">${icon("timer")} Iniciar sessão</button></div></div>
  <section class="panel flush"><div class="statstrip" style="grid-template-columns:repeat(5,1fr)">${Object.entries(TYPE_LABEL).map(([k, v]) =>
    `<div><div class="stat-label"><span class="dot ${KIND[TYPE_KIND[k]]?.cls || "k-other"}"></span>${v}</div><div class="stat-value num">${hm(tot[k]?.m || 0, { zero: "0h", compact: true })}</div><div class="faint" style="font-size:12px">${tot[k]?.n || 0} sessões</div></div>`).join("")}</div></section>
  <section class="section">${Object.keys(byDate).length ? Object.entries(byDate).map(([date, ss]) => `
    <div class="section-head" style="margin-top:20px"><span class="label">${fmtDate(date, "long")}</span><span class="faint num">${hm(ss.reduce((a, s) => a + (s.status === "missed" ? 0 : s.actual_min), 0))}</span></div>
    <div class="panel" style="padding:4px 18px">${ss.map((s) => `<div class="task ${KIND[TYPE_KIND[s.type]]?.cls || "k-other"}"><span class="rail"></span>
      <div><div class="t-title">${esc(s.title)}</div><div class="t-meta"><span>${TYPE_LABEL[s.type]}</span><span class="num">plan. ${hm(s.planned_min)} · real ${hm(s.actual_min)}</span>
        ${s.status !== "done" ? `<span class="chip ${s.status === "partial" ? "warn" : ""}">${STATUS[s.status]}</span>` : ""}${s.focus ? `<span class="chip">${icon("timer")} foco</span>` : ""}</div>
        ${s.notes ? `<p class="muted" style="margin:6px 0 0;font-size:13px;white-space:pre-wrap">${esc(s.notes)}</p>` : ""}</div>
      <div class="row"><button class="btn ghost sm icon-only" data-edit="${s.id}" aria-label="Editar">${icon("notebook-pen")}</button><button class="btn ghost sm icon-only danger" data-del="${s.id}" aria-label="Excluir">${icon("trash-2")}</button></div></div>`).join("")}</div>`).join("")
    : `<div class="panel">${empty("history", "Nenhuma sessão registrada", "Use “Iniciar sessão” para estudar com timer ou registre manualmente.")}</div>`}</section>`;
  el.querySelector("#add").onclick = () => sessionForm();
  el.querySelector("#start").onclick = () => openFocusPicker();
  el.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => sessionForm(d.sessions.find((s) => s.id === +b.dataset.edit)));
  el.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => {
    if (!(await confirmDialog("Excluir sessão?", "O XP e o progresso desta sessão serão removidos e o plano futuro recalculado.", "Excluir"))) return;
    try { await api(`/sessions/${b.dataset.del}`, { method: "DELETE" }); toast("Sessão excluída."); window.dispatchEvent(new Event("study:changed")); }
    catch (e) { toast(e.message, { type: "error" }); }
  });
}
