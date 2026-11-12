import { api, busy, confirmDialog, esc, fmtDate, hm, icon, pct, toast, WEEK } from "../core.js";

function download(blob, name) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default async function settings(el) {
  const [s, h] = await Promise.all([api("/settings"), api("/health")]);
  const weekly = Object.values(s.capacity).reduce((a, b) => a + b, 0);
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">Sistema</p><h1>Ajustes</h1></div></div>
  <div class="grid grid-2">
    <section class="panel"><div class="panel-head"><h2>Rotina de estudo</h2><span class="faint num" id="weekly">${hm(weekly)} / semana</span></div>
      <form id="cap-form">
        ${WEEK.map((d, i) => `<div class="row" style="padding:6px 0;border-top:${i ? "1px solid var(--border)" : "0"}">
          <label for="cap-${i}" style="flex:1">${d}${i === s.rest_weekday ? ` <span class="chip">descanso</span>` : ""}${i === s.project_weekday ? ` <span class="chip warn">projeto</span>` : ""}</label>
          <input id="cap-${i}" class="input num" type="number" min="0" max="480" step="5" value="${s.capacity[i]}" style="width:96px" ${i === s.rest_weekday ? "disabled" : ""}><span class="faint" style="width:30px">min</span></div>`).join("")}
        <div class="field-row" style="margin-top:14px">
          <div class="field"><label for="rest">Dia de descanso</label><select id="rest" class="input">${WEEK.map((d, i) => `<option value="${i}" ${i === s.rest_weekday ? "selected" : ""}>${d}</option>`).join("")}</select></div>
          <div class="field"><label for="proj">Dia de projeto</label><select id="proj" class="input">${WEEK.map((d, i) => `<option value="${i}" ${i === s.project_weekday ? "selected" : ""}>${d}</option>`).join("")}</select></div>
        </div>
        <div class="field-row">
          <div class="field"><label for="start">Início</label><input id="start" class="input" type="date" value="${s.start_date}"></div>
          <div class="field"><label for="focus">Bloco do Focus (min)</label><input id="focus" class="input num" type="number" min="5" max="180" value="${s.focus_minutes}"></div>
        </div>
        <div class="field"><span class="lbl">Datas especiais</span><div class="row wrap">${Object.entries(s.holidays).map(([d, m]) => `<span class="chip">${fmtDate(d)} · ${m === 0 ? "descanso" : `${Math.round(m * 100)}%`}</span>`).join("")}</div></div>
        <button class="btn primary" id="save-cap">${icon("check")} Salvar e recalcular</button>
      </form></section>
    <div class="stack">
      <section class="panel"><h2 style="margin-bottom:6px">Dados locais</h2><p class="faint" style="font-size:12.5px;margin:0 0 14px">Tudo fica no SQLite desta máquina: <span class="mono">${esc(h.db)}</span></p>
        <div class="row wrap">
          <button class="btn" id="bk">${icon("database")} Backup (.db)</button>
          <label class="btn" for="rs">${icon("rotate-ccw")} Restaurar backup</label><input type="file" id="rs" accept=".db,.sqlite" class="sr-only">
          <button class="btn" id="ex">${icon("download")} Exportar JSON</button>
          <label class="btn" for="im">${icon("upload")} Importar JSON</label><input type="file" id="im" accept="application/json,.json" class="sr-only">
        </div></section>
      <section class="panel"><h2 style="margin-bottom:6px">Catálogo da formação</h2><p class="faint" style="font-size:12.5px;margin:0 0 14px">Quando tiver os prints que faltam, importe o <span class="mono">catalog.json</span> atualizado. O progresso é preservado pelos IDs das aulas.</p>
        <div class="row wrap"><a class="btn" href="/api/catalog/export">${icon("file-json")} Baixar catalog.json</a>
          <label class="btn" for="cat">${icon("upload")} Importar catálogo</label><input type="file" id="cat" accept="application/json,.json" class="sr-only"></div></section>
      <section class="panel"><h2 style="margin-bottom:6px">Instalar como app</h2>
        <p class="faint" style="font-size:12.5px;margin:0 0 14px">Windows (Chrome/Edge): ícone de instalar na barra de endereço. Android (Chrome): menu ⋮ → Instalar app. Veja o README para acesso pelo celular.</p>
        <button class="btn" id="install" disabled>${icon("download")} Instalar AI Engineer Study Tracker</button></section>
      <p class="faint" style="font-size:12px">Versão ${esc(h.version)} · hoje ${fmtDate(h.today, "full")}</p>
    </div>
  </div>`;

  const rest = el.querySelector("#rest");
  el.querySelectorAll("[id^=cap-]").forEach((i) => i.oninput = () => {
    const tot = [...el.querySelectorAll("[id^=cap-]")].reduce((a, x, idx) => a + (idx === +rest.value ? 0 : +x.value || 0), 0);
    el.querySelector("#weekly").textContent = `${hm(tot)} / semana`;
  });
  el.querySelector("#cap-form").onsubmit = async (e) => {
    e.preventDefault();
    const btn = el.querySelector("#save-cap");
    const capacity = {};
    for (let i = 0; i < 7; i++) capacity[i] = i === +rest.value ? 0 : Math.round(+el.querySelector(`#cap-${i}`).value || 0);
    busy(btn);
    try {
      const r = await api("/settings", { method: "PUT", body: { capacity, rest_weekday: +rest.value, project_weekday: +el.querySelector("#proj").value,
        start_date: el.querySelector("#start").value, focus_minutes: +el.querySelector("#focus").value } });
      toast(`Rotina salva · novo término ${fmtDate(r.end, "full")}`, { type: "good" });
      settings(el);
    } catch (err) { toast(err.message, { type: "error" }); busy(btn, false); }
  };
  el.querySelector("#bk").onclick = async (e) => {
    busy(e.currentTarget);
    try { download(await api("/backup"), `study-tracker-${h.today}.db`); toast("Backup gerado (cópia também em database/backups).", { type: "good" }); }
    catch (err) { toast(err.message, { type: "error" }); } finally { busy(e.currentTarget, false); }
  };
  el.querySelector("#ex").onclick = async () => {
    try { const blob = await api("/export"); download(blob instanceof Blob ? blob : new Blob([JSON.stringify(blob, null, 2)], { type: "application/json" }), `study-tracker-${h.today}.json`); }
    catch (err) { toast(err.message, { type: "error" }); }
  };
  const upload = (inputId, path, confirmText, ok) => el.querySelector(inputId).onchange = async (e) => {
    const f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (!(await confirmDialog("Confirmar", confirmText, "Continuar"))) return;
    const form = new FormData(); form.append("file", f);
    try { const r = await api(path, { method: "POST", form }); toast(ok(r), { type: "good" }); window.dispatchEvent(new Event("study:changed")); }
    catch (err) { toast(err.message, { type: "error" }); }
  };
  upload("#rs", "/restore", "Restaurar substitui todos os dados atuais. Um backup de segurança será criado antes.", (r) => `Backup restaurado (segurança: ${r.safety_backup}).`);
  upload("#im", "/import", "Importar substitui sessões, progresso e notas pelos do arquivo.", () => "Dados importados.");
  el.querySelector("#cat").onchange = async (e) => {
    const f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const r = await api("/catalog/import", { method: "POST", body: data });
      toast(`Catálogo importado: ${r.courses_unique} cursos, ${hm(r.unique_min)} únicos.`, { type: "good" });
      window.dispatchEvent(new Event("study:changed"));
    } catch (err) { toast(err.message.startsWith("Unexpected") ? "JSON inválido." : err.message, { type: "error" }); }
  };
  // LAN: aviso explícito
  el.querySelector(".grid.grid-2").insertAdjacentHTML("beforebegin", h.lan
    ? `<div class="notice" style="margin-bottom:16px">${icon("triangle-alert")}<div><b>Modo LAN ativo.</b> Qualquer dispositivo com acesso à sua rede Wi-Fi pode abrir este app e ler/alterar seus dados (não há senha). Use só em rede confiável.</div></div>` : "");

  // Prática por curso e pontos de partida (estimativas editáveis)
  const [cat, comps] = await Promise.all([api("/catalog"), api("/competencies")]);
  el.insertAdjacentHTML("beforeend", `<div class="grid grid-2 section">
    <section class="panel"><h2 style="margin-bottom:6px">Prática por curso <span class="chip" style="height:20px;font-size:11px">ESTIMATIVA DO SISTEMA</span></h2>
      <p class="faint" style="font-size:12.5px;margin:0 0 12px">Prática = % da duração real do vídeo. Não vem dos prints.</p>
      <form id="pr-form">${cat.courses.map((c) => `<div class="row" style="padding:5px 0;border-top:1px solid var(--border)">
        <label for="pr-${c.id}" style="flex:1;min-width:0"><span style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.title)}</span><span class="faint" style="font-size:11.5px">vídeo ${hm(c.duration_min)} → prática ${hm(c.practice_est_min)}</span></label>
        <input id="pr-${c.id}" data-id="${c.id}" class="input num" type="number" min="0" max="300" step="5" value="${Math.round(c.practice_ratio * 100)}" style="width:78px"><span class="faint">%</span></div>`).join("")}
        <button class="btn primary" style="margin-top:12px" id="pr-save">${icon("check")} Salvar e recalcular</button></form></section>
    <section class="panel"><h2 style="margin-bottom:6px">Competências: ponto de partida <span class="chip" style="height:20px;font-size:11px">ESTIMATIVA EDITÁVEL</span></h2>
      <p class="faint" style="font-size:12.5px;margin:0 0 12px">Quanto você já domina antes da formação. Valores iniciais são chutes razoáveis; ajuste à sua realidade.</p>
      <form id="bl-form">${comps.competencies.map((c) => `<div class="row" style="padding:5px 0;border-top:1px solid var(--border)">
        <label for="bl-${c.id}" style="flex:1">${esc(c.label)}</label>
        <input id="bl-${c.id}" data-id="${c.id}" class="input num" type="number" min="0" max="100" step="5" value="${Math.round(c.baseline * 100)}" style="width:78px"><span class="faint">%</span></div>`).join("")}
        <button class="btn primary" style="margin-top:12px" id="bl-save">${icon("check")} Salvar</button></form></section></div>`);
  const saveMap = (formSel, key, divisor, btnSel) => el.querySelector(formSel).onsubmit = async (e) => {
    e.preventDefault();
    const map = {};
    el.querySelectorAll(`${formSel} input[data-id]`).forEach((i) => { map[i.dataset.id] = Math.max(0, Math.min(key === "practice_overrides" ? 300 : 100, +i.value || 0)) / divisor; });
    const btn = el.querySelector(btnSel); busy(btn);
    try { await api("/settings", { method: "PUT", body: { [key]: map } }); toast("Salvo e plano recalculado.", { type: "good" }); window.dispatchEvent(new Event("study:changed")); }
    catch (err) { toast(err.message, { type: "error" }); } finally { busy(btn, false); }
  };
  saveMap("#pr-form", "practice_overrides", 100, "#pr-save");
  saveMap("#bl-form", "competency_baselines", 100, "#bl-save");

  const inst = el.querySelector("#install");
  const enable = () => { if (window.__installPrompt) inst.disabled = false; };
  enable(); window.addEventListener("pwa:installable", enable, { once: true });
  inst.onclick = async () => { const p = window.__installPrompt; if (!p) return; p.prompt(); await p.userChoice; window.__installPrompt = null; inst.disabled = true; };
}
