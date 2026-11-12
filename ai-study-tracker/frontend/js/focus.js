// Focus Mode: timer com pausa, persistência local e registro da sessão ao finalizar.
import { $, api, closeLayer, esc, hm, icon, KIND, openLayer, phaseTag, rewardToast, toast, TYPE_LABEL, busy } from "./core.js";

const KEY = "ast:focus";
let tick = null;

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const save = (s) => { try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch { /* sem storage */ } };
let state = null;

function elapsedMs(s) {
  const end = s.pausedAt || Date.now();
  return Math.max(0, end - s.startedAt - s.pausedTotal);
}

export function itemToSession(item) {
  const k = item.kind;
  const base = { kind: k, title: item.title, planned_min: Math.round(item.minutes || 0), phase: item.phase, detail: item.detail || {} };
  if (k === "video") return { ...base, type: "VIDEO", target_kind: "lesson", target_id: item.ref };
  if (k === "practice") return { ...base, type: "PRACTICE", target_kind: "module", target_id: item.ref };
  if (k === "project") return { ...base, type: "PROJECT", target_kind: "stage", target_id: item.ref };
  if (k === "review") return { ...base, type: "REVIEW", target_kind: "review", target_id: null, review_keys: (item.detail?.reviews || []).map((r) => r.key) };
  return { ...base, type: item.type || "OTHER", target_kind: "free", target_id: null };
}

export async function openFocusPicker(preselect) {
  if (load()) { renderFocus(); return; }
  let data;
  try { data = await api("/today"); } catch (e) { toast(e.message, { type: "error" }); return; }
  const items = data.items.length ? data.items : data.next_day?.items || [];
  const cfg = await api("/settings").catch(() => ({ focus_minutes: 25 }));
  const box = openLayer(`
    <div class="modal-head"><div><p class="eyebrow">Iniciar sessão</p><h2>O que você vai fazer agora?</h2></div>
      <button class="btn ghost icon-only" data-close aria-label="Fechar">${icon("x")}</button></div>
    ${items.length ? `<div class="stack" style="gap:8px">${items.map((it, i) => `
      <button class="task ${KIND[it.kind]?.cls}" data-i="${i}" style="all:unset;display:grid;grid-template-columns:4px 1fr auto;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:10px;cursor:pointer" aria-label="Focar em ${esc(it.title)}">
        <span class="rail" style="align-self:stretch;border-radius:3px;background:var(--k)"></span>
        <span><span class="t-title" style="display:block;font-weight:500">${esc(it.title)}</span>
        <span class="t-meta" style="display:flex;gap:8px;margin-top:4px;font-size:12px;color:var(--text-3)">${phaseTag(it.kind, it.phase)} ${hm(it.minutes)}</span></span>
        ${icon("play")}</button>`).join("")}</div>
      ${!data.items.length && data.next_day ? `<p class="faint" style="font-size:12.5px;margin-top:10px">Hoje não há itens planejados — adiantando o próximo dia de estudo (${esc(data.next_day.weekday)}).</p>` : ""}`
      : `<p class="muted">Nada planejado. Use uma sessão livre.</p>`}
    <hr class="divider">
    <details ${items.length ? "" : "open"}><summary style="cursor:pointer;font-weight:500">Sessão livre</summary>
      <div style="margin-top:12px" class="field-row">
        <div class="field"><label for="ff-type">Tipo</label><select id="ff-type" class="input">${Object.entries(TYPE_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
        <div class="field"><label for="ff-title">Conteúdo</label><input id="ff-title" class="input" placeholder="Ex.: estudo livre de MCP" maxlength="200"></div>
      </div>
      <button class="btn" id="ff-go">${icon("play")} Iniciar sessão livre</button>
    </details>
    <hr class="divider">
    <div class="row wrap"><span class="faint" style="font-size:12.5px">Duração do bloco</span>
      <div class="seg" id="ff-dur">${[25, 50, 0].map((m) => `<button type="button" data-m="${m}" aria-pressed="${m === (cfg.focus_minutes || 25)}">${m ? `${m} min` : "Tempo planejado"}</button>`).join("")}</div></div>`,
    { label: "Iniciar sessão" });
  let dur = cfg.focus_minutes || 25;
  box.querySelectorAll("#ff-dur button").forEach((b) => b.onclick = () => {
    dur = +b.dataset.m;
    box.querySelectorAll("#ff-dur button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  });
  const start = (sess) => {
    const target = dur || sess.planned_min || 25;
    state = { sess, startedAt: Date.now(), pausedAt: null, pausedTotal: 0, targetMin: target };
    save(state);
    closeLayer();
    renderFocus();
  };
  box.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => start(itemToSession(items[+b.dataset.i])));
  box.querySelector("#ff-go").onclick = () => {
    const title = box.querySelector("#ff-title").value.trim();
    if (!title) { box.querySelector("#ff-title").setAttribute("aria-invalid", "true"); box.querySelector("#ff-title").focus(); return; }
    const type = box.querySelector("#ff-type").value;
    start({ kind: "other", type, title, planned_min: 0, target_kind: "free", target_id: null, phase: TYPE_LABEL[type].toUpperCase() });
  };
  if (preselect) start(itemToSession(preselect));
}

export function startFocusWith(item) {
  if (load()) { toast("Já existe uma sessão em andamento.", { type: "error" }); renderFocus(); return; }
  openFocusPicker(item);
}

export function resumeFocusIfAny() { if (load()) renderFocus(); }

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.25);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.25 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.25 + 0.6);
      o.start(ctx.currentTime + i * 0.25); o.stop(ctx.currentTime + i * 0.25 + 0.7);
    });
  } catch { /* sem áudio */ }
}

function renderFocus() {
  state = load();
  if (!state) return;
  const s = state.sess;
  const kindCls = KIND[s.kind]?.cls || "k-other";
  const R = 160, C = 2 * Math.PI * R;
  const ov = $("#overlay");
  ov.innerHTML = `<section class="focus ${kindCls}" role="dialog" aria-modal="true" aria-label="Focus mode">
    <div class="focus-top"><span class="focus-label">FOCUS</span>
      <button class="btn ghost sm" id="fx-min" aria-label="Minimizar">${icon("chevron-left")} Voltar ao app</button></div>
    ${phaseTag(s.kind, s.phase)}
    <h1 class="focus-title">${esc(s.title)}</h1>
    <p class="faint" style="margin:0;font-size:13px">${s.planned_min ? `Planejado: ${hm(s.planned_min)} · ` : ""}Bloco de ${state.targetMin} min</p>
    <div class="focus-ring"><svg viewBox="0 0 340 340"><circle class="track" cx="170" cy="170" r="${R}"/><circle class="prog" id="fx-prog" cx="170" cy="170" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
      <div class="focus-time"><b id="fx-time" class="num">25:00</b><span id="fx-sub">restante</span></div></div>
    <div class="focus-actions">
      <button class="btn lg" id="fx-pause">${icon("pause")} <span>Pausar</span></button>
      <button class="btn lg primary" id="fx-finish">${icon("square")} Finalizar</button>
    </div>
    <button class="btn ghost sm" id="fx-cancel" style="margin-top:18px">Descartar sessão</button>
  </section>`;
  const root = ov.querySelector(".focus");
  let chimed = elapsedMs(state) >= state.targetMin * 60000;
  const update = () => {
    const ms = elapsedMs(state), target = state.targetMin * 60000;
    const left = target - ms, over = left < 0;
    const t = Math.abs(over ? -left : left) / 1000;
    const mm = String(Math.floor(t / 60)).padStart(2, "0"), ss = String(Math.floor(t % 60)).padStart(2, "0");
    $("#fx-time").textContent = `${over ? "+" : ""}${mm}:${ss}`;
    $("#fx-sub").textContent = state.pausedAt ? "pausado" : over ? "tempo extra" : "restante";
    $("#fx-prog").style.strokeDashoffset = C * (1 - Math.min(1, ms / target));
    document.title = `${over ? "+" : ""}${mm}:${ss} · Focus`;
    if (over && !chimed) { chimed = true; chime(); }
  };
  const setPaused = () => {
    root.classList.toggle("paused", !!state.pausedAt);
    $("#fx-pause").innerHTML = state.pausedAt ? `${icon("play")} <span>Retomar</span>` : `${icon("pause")} <span>Pausar</span>`;
  };
  clearInterval(tick);
  tick = setInterval(update, 250);
  update(); setPaused();
  $("#fx-pause").onclick = () => {
    if (state.pausedAt) { state.pausedTotal += Date.now() - state.pausedAt; state.pausedAt = null; }
    else state.pausedAt = Date.now();
    save(state); setPaused(); update();
  };
  $("#fx-min").onclick = () => { clearInterval(tick); ov.innerHTML = ""; document.title = "AI Engineer Study Tracker"; showResumeChip(); };
  $("#fx-cancel").onclick = () => { if (confirm("Descartar esta sessão sem registrar?")) { stop(); toast("Sessão descartada."); } };
  $("#fx-finish").onclick = () => finishDialog();
  $("#fx-pause").focus();
}

function showResumeChip() {
  if (!load() || $("#fx-chip")) return;
  const b = document.createElement("button");
  b.id = "fx-chip"; b.className = "btn primary";
  b.style.cssText = "position:fixed;right:20px;bottom:90px;z-index:40;border-radius:999px";
  b.innerHTML = `${icon("timer")} Sessão em andamento`;
  b.onclick = () => { b.remove(); renderFocus(); };
  document.body.appendChild(b);
}

function stop() {
  clearInterval(tick); save(null); state = null;
  $("#overlay").innerHTML = ""; document.title = "AI Engineer Study Tracker";
  $("#fx-chip")?.remove();
}

function finishDialog() {
  if (!state.pausedAt) { state.pausedAt = Date.now(); save(state); }
  clearInterval(tick);
  const s = state.sess;
  const mins = Math.max(1, Math.round(elapsedMs(state) / 60000));
  const box = openLayer(`
    <div class="modal-head"><div><p class="eyebrow">Sessão concluída</p><h2>${esc(s.title)}</h2></div></div>
    <div class="field-row">
      <div class="field"><label for="fd-min">Tempo realizado (min)</label><input id="fd-min" class="input num" type="number" min="1" max="720" value="${mins}" required></div>
      <div class="field"><label for="fd-status">Status</label><select id="fd-status" class="input"><option value="done">Concluída</option><option value="partial">Parcial (continuar depois)</option></select></div>
    </div>
    ${s.kind === "video" ? `<label class="row" style="margin-bottom:14px;cursor:pointer"><input type="checkbox" id="fd-lesson" checked> Marcar aula/bloco como concluído</label>` : ""}
    ${s.kind === "review" ? `<p class="faint" style="font-size:12.5px">${(s.review_keys || []).length} revisão(ões) serão marcadas como feitas.</p>` : ""}
    <div class="field"><label for="fd-notes">Observações / o que aprendi</label><textarea id="fd-notes" class="input" maxlength="4000" placeholder="Uma frase sobre o que ficou claro e o que ainda está confuso."></textarea></div>
    <div class="row" style="justify-content:flex-end"><button class="btn" id="fd-back">Voltar ao timer</button><button class="btn primary" id="fd-save">${icon("check")} Registrar sessão</button></div>`,
    { label: "Finalizar sessão", onClose: () => { if (load()) showResumeChip(); } });
  box.querySelector("#fd-status").onchange = (e) => { const c = box.querySelector("#fd-lesson"); if (c) c.checked = e.target.value === "done"; };
  box.querySelector("#fd-back").onclick = () => { state.pausedTotal += Date.now() - state.pausedAt; state.pausedAt = null; save(state); renderFocus(); };
  box.querySelector("#fd-save").onclick = async (ev) => {
    const inp = box.querySelector("#fd-min");
    const actual = +inp.value;
    if (!(actual >= 1 && actual <= 720)) { inp.setAttribute("aria-invalid", "true"); inp.focus(); return; }
    const status = box.querySelector("#fd-status").value;
    const now = new Date();
    const payload = {
      date: (await api("/health")).today, type: s.type, target_kind: s.target_kind, target_id: s.target_id,
      title: s.title, planned_min: s.planned_min || 0, actual_min: actual, status, focus: true,
      notes: box.querySelector("#fd-notes").value, started_at: new Date(state.startedAt).toISOString(), ended_at: now.toISOString(),
      complete_lessons: s.kind === "video" && box.querySelector("#fd-lesson")?.checked ? [s.target_id] : [],
      review_keys: s.kind === "review" ? s.review_keys || [] : [],
    };
    busy(ev.currentTarget);
    try {
      const r = await api("/sessions", { method: "POST", body: payload });
      stop();
      rewardToast(r, "Sessão concluída");
      window.dispatchEvent(new Event("study:changed"));
    } catch (e) { busy(ev.currentTarget, false); toast(e.message, { type: "error" }); }
  };
}
