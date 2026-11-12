import { api, busy, confirmDialog, esc, fmtDate, hm, icon, toast, WEEK } from "../core.js";

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
          <label for="cap-${i}" style="flex:1">${d}${i === s.rest_weekday ? ` <span class="chip">descanso</span>` : ""}</label>
          <input id="cap-${i}" class="input num" type="number" min="0" max="480" step="5" value="${s.capacity[i]}" style="width:96px" ${i === s.rest_weekday ? "disabled" : ""}><span class="faint" style="width:30px">min</span></div>`).join("")}
        <div class="field" style="margin-top:14px"><label for="rest">Dia de descanso</label><select id="rest" class="input">${WEEK.map((d, i) => `<option value="${i}" ${i === s.rest_weekday ? "selected" : ""}>${d}</option>`).join("")}</select></div>
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
      <section class="panel"><h2 style="margin-bottom:6px">Catálogo da formação</h2><p class="faint" style="font-size:12.5px;margin:0 0 14px">Importe um <span class="mono">catalog.json</span> atualizado. O progresso é preservado pelos IDs das aulas.</p>
        <div class="row wrap"><a class="btn" href="/api/catalog/export">${icon("file-json")} Baixar catalog.json</a>
          <label class="btn" for="cat">${icon("upload")} Importar catálogo</label><input type="file" id="cat" accept="application/json,.json" class="sr-only"></div></section>
      <section class="panel"><h2 style="margin-bottom:6px">Instalar como app</h2>
        <p class="faint" style="font-size:12.5px;margin:0 0 14px">Chrome ou Edge no Windows: ícone de instalar na barra de endereço. O app abre em janela própria; o servidor (start.bat) precisa estar rodando.</p>
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
      const r = await api("/settings", { method: "PUT", body: { capacity, rest_weekday: +rest.value, start_date: el.querySelector("#start").value, focus_minutes: +el.querySelector("#focus").value } });
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
  // Pontos de partida das competências (estimativas editáveis)
  const comps = await api("/competencies");
  el.insertAdjacentHTML("beforeend", `<section class="panel section"><h2 style="margin-bottom:6px">Competências: ponto de partida <span class="chip" style="height:20px;font-size:11px">ESTIMATIVA EDITÁVEL</span></h2>
      <p class="faint" style="font-size:12.5px;margin:0 0 12px">Quanto você já domina antes da formação. Os valores iniciais são estimativas, não fatos: ajuste à sua realidade.</p>
      <form id="bl-form" style="columns:2;column-gap:32px">${comps.competencies.map((c) => `<div class="row" style="padding:5px 0;border-top:1px solid var(--border);break-inside:avoid">
        <label for="bl-${c.id}" style="flex:1">${esc(c.label)}</label>
        <input id="bl-${c.id}" data-id="${c.id}" class="input num" type="number" min="0" max="100" step="5" value="${Math.round(c.baseline * 100)}" style="width:78px"><span class="faint">%</span></div>`).join("")}
        <div style="column-span:all;margin-top:12px"><button class="btn primary" id="bl-save">${icon("check")} Salvar</button></div></form></section>`);
  el.querySelector("#bl-form").onsubmit = async (e) => {
    e.preventDefault();
    const map = {};
    el.querySelectorAll("#bl-form input[data-id]").forEach((i) => { map[i.dataset.id] = Math.max(0, Math.min(100, +i.value || 0)) / 100; });
    const btn = el.querySelector("#bl-save"); busy(btn);
    try { await api("/settings", { method: "PUT", body: { competency_baselines: map } }); toast("Pontos de partida salvos.", { type: "good" }); window.dispatchEvent(new Event("study:changed")); }
    catch (err) { toast(err.message, { type: "error" }); } finally { busy(btn, false); }
  };

  const inst = el.querySelector("#install");
  const enable = () => { if (window.__installPrompt) inst.disabled = false; };
  enable(); window.addEventListener("pwa:installable", enable, { once: true });
  inst.onclick = async () => { const p = window.__installPrompt; if (!p) return; p.prompt(); await p.userChoice; window.__installPrompt = null; inst.disabled = true; };
}
