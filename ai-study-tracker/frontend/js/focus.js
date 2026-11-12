// Sessão de estudo simples: iniciar · pausar · concluir. Ao concluir: registra, atualiza progresso/XP e carrega a próxima atividade.
import { $, api, closeLayer, esc, hm, icon, KIND, mmss, phaseTag, rewardToast, toast, busy } from "./core.js";

const KEY = "ast:session";
let tick = null;
let state = null;
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const save = (s) => { try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch { /* sem storage */ } };
const elapsedMs = (s) => Math.max(0, (s.pausedAt || Date.now()) - s.startedAt - s.pausedTotal);

/** Registra a conclusão de um item do plano. Devolve a recompensa (XP etc.). */
export async function completeItem(item, elapsedMin = 0) {
  const today = (await api("/health")).today;
  const d = item.detail || {};
  const mins = Math.max(1, Math.round(elapsedMin || item.minutes || 1));
  if (item.kind === "video") {
    if (d.has_duration === false || !(item.minutes > 0)) {
      return api(`/lessons/${encodeURIComponent(item.ref)}/toggle`, { method: "POST", body: { completed: true } });
    }
    return api("/sessions", { method: "POST", body: { date: today, type: "VIDEO", target_kind: "lesson", target_id: item.ref, title: item.title,
      planned_min: Math.round(item.minutes), actual_min: mins, focus: elapsedMin > 0, complete_lessons: [item.ref] } });
  }
  if (item.kind === "practice") {
    return api("/sessions", { method: "POST", body: { date: today, type: "PRACTICE", target_kind: "content", target_id: item.ref, title: item.title,
      planned_min: Math.round(item.minutes), actual_min: mins, focus: elapsedMin > 0 } });
  }
  if (item.kind === "project") {
    return api("/sessions", { method: "POST", body: { date: today, type: "PROJECT", target_kind: "project", target_id: item.ref, title: item.title,
      planned_min: Math.round(item.minutes), actual_min: mins, focus: elapsedMin > 0 } });
  }
  if (item.kind === "review") {
    let r;
    for (const x of d.reviews || []) r = await api(`/reviews/${encodeURIComponent(x.key)}/done`, { method: "POST" });
    return r;
  }
  throw new Error("Tipo de atividade desconhecido.");
}

const label = (it) => it.kind === "video" ? (it.detail?.num ? `Aula ${it.detail.num}` : "Aula") : KIND[it.kind]?.label || "Atividade";

async function nextItem() {
  const d = await api("/dashboard");
  return d.study_now;
}

export function startFocusWith(item) {
  if (load()) { renderSession(); return; }
  state = { item, startedAt: null, pausedAt: null, pausedTotal: 0, running: false };
  save(state);
  renderSession();
}
export function openFocusPicker() {
  if (load()) { renderSession(); return; }
  api("/dashboard").then((d) => {
    if (d.study_now) startFocusWith(d.study_now.item);
    else toast("Nada planejado para estudar agora. Veja o Cronograma.", {});
  }).catch((e) => toast(e.message, { type: "error" }));
}
export function resumeFocusIfAny() { if (load()) renderSession(); }

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.25); g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.25 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.25 + 0.6); o.start(ctx.currentTime + i * 0.25); o.stop(ctx.currentTime + i * 0.25 + 0.7);
    });
  } catch { /* sem áudio */ }
}

function shell(inner) {
  const ov = $("#overlay");
  ov.innerHTML = `<section class="session" role="dialog" aria-modal="true" aria-label="Sessão de estudo"><div class="session-card glass">${inner}</div></section>`;
  return ov.querySelector(".session-card");
}
function stop() { clearInterval(tick); save(null); state = null; $("#overlay").innerHTML = ""; document.title = "AI Engineer Study Tracker"; $("#fx-chip")?.remove(); }

function renderSession() {
  state = load();
  if (!state) return;
  const it = state.item, d = it.detail || {};
  const isReview = it.kind === "review";
  const timed = !isReview && it.minutes > 0 && d.has_duration !== false;
  const target = timed ? it.minutes * 60000 : 0;
  const box = shell(`
    <div class="row" style="justify-content:space-between"><span class="eyebrow" style="margin:0">${esc(d.course || (isReview ? "Revisão espaçada" : KIND[it.kind]?.label || ""))}</span>
      <button class="btn ghost sm" id="se-min" aria-label="Minimizar">${icon("chevron-left")} Voltar ao app</button></div>
    <div style="margin:18px 0 6px">${phaseTag(it.kind, it.phase)}</div>
    <h1 class="session-title">${isReview ? "Revisão espaçada" : esc(it.title)}</h1>
    ${!isReview ? `<p class="muted" style="margin:6px 0 0">${label(it)}${it.kind === "practice" ? " · tempo estimado" : ""}</p>` : `<ul class="review-list">${(d.reviews || []).map((r) => `<li>D+${r.interval} · conteúdo de ${esc(r.learned_on)}</li>`).join("")}</ul>`}
    ${isReview ? "" : `<div class="session-time num" id="se-time">${timed ? mmss(it.minutes) : '<span class="dash">-</span>'}</div>
    <div class="faint" id="se-sub" style="text-align:center;font-size:13px">${timed ? "tempo da aula" : "sem duração no player"}</div>`}
    <div class="session-actions">
      ${isReview || !timed ? "" : `<button class="btn lg" id="se-start">${icon("play")} <span>Iniciar</span></button>`}
      <button class="btn lg primary" id="se-done">${icon("check")} ${isReview ? "Marcar como revisado" : "Concluir"}</button>
    </div>
    <div style="text-align:center;margin-top:14px"><button class="btn ghost sm" id="se-cancel">Descartar</button></div>`);
  const $t = (s) => box.querySelector(s);
  const update = () => {
    if (!timed) return;
    const ms = state.startedAt ? elapsedMs(state) : 0;
    const left = target - ms, over = left < 0, t = Math.abs(left) / 1000;
    $t("#se-time").textContent = `${over ? "+" : ""}${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
    $t("#se-sub").textContent = !state.startedAt ? "tempo da aula" : state.pausedAt ? "pausado" : over ? "tempo extra" : "restante";
    $t("#se-time").classList.toggle("paused", !!state.pausedAt);
    if (over && state.startedAt && !state.pausedAt && !state.chimed) { state.chimed = true; save(state); chime(); }
    if (state.startedAt) document.title = `${$t("#se-time").textContent} · ${it.title}`;
  };
  clearInterval(tick); tick = setInterval(update, 500); update();
  const startBtn = $t("#se-start");
  if (startBtn) {
    const setLabel = () => { startBtn.innerHTML = `${icon(state.running ? "pause" : "play")} <span>${!state.startedAt ? "Iniciar" : state.running ? "Pausar" : "Retomar"}</span>`; };
    setLabel();
    startBtn.onclick = () => {
      if (!state.startedAt) { state.startedAt = Date.now(); state.running = true; }
      else if (state.running) { state.pausedAt = Date.now(); state.running = false; }
      else { state.pausedTotal += Date.now() - state.pausedAt; state.pausedAt = null; state.running = true; }
      save(state); setLabel(); update();
    };
  }
  $t("#se-min").onclick = () => { clearInterval(tick); $("#overlay").innerHTML = ""; document.title = "AI Engineer Study Tracker"; showChip(); };
  $t("#se-cancel").onclick = () => { stop(); toast("Sessão descartada."); };
  $t("#se-done").onclick = async (ev) => {
    const btn = ev.currentTarget; busy(btn);
    const used = state.startedAt ? elapsedMs(state) / 60000 : 0;
    try {
      const r = await completeItem(it, used);
      clearInterval(tick); save(null); state = null;
      window.dispatchEvent(new Event("study:changed"));
      showDone(it, r);
    } catch (e) { busy(btn, false); toast(e.message, { type: "error" }); }
  };
}

async function showDone(it, r) {
  const nxt = await nextItem().catch(() => null);
  document.title = "AI Engineer Study Tracker";
  const box = shell(`
    <div class="done-badge">${icon("check", "icon icon-lg")}</div>
    <h1 class="session-title" style="text-align:center">Concluída</h1>
    <p class="muted" style="text-align:center;margin:4px 0 0">${esc(it.kind === "review" ? "Revisão feita" : it.title)}</p>
    ${r?.xp_gained > 0 ? `<div class="xp-pop">+${r.xp_gained} XP</div>` : ""}
    ${(r?.new_achievements || []).map((a) => `<div class="chip accent" style="margin:6px auto;display:flex;width:fit-content">${icon("trophy")} ${esc(a)}</div>`).join("")}
    ${r?.level_up ? `<div class="chip good" style="margin:6px auto;display:flex;width:fit-content">Novo nível: ${esc(r.level.name)}</div>` : ""}
    ${nxt ? `<div class="next-card"><div class="eyebrow" style="margin:0 0 6px">Próxima atividade</div><b>${esc(nxt.title)}</b>
      <div class="faint" style="font-size:13px;margin-top:2px">${esc(nxt.course || "")}${nxt.minutes > 0 ? ` · ${nxt.duration_min ? mmss(nxt.duration_min) : hm(nxt.minutes)}` : ""}</div></div>
      <div class="session-actions"><button class="btn lg" id="se-close">Encerrar por hoje</button><button class="btn lg primary" id="se-next">${icon("play")} Continuar</button></div>`
      : `<p class="muted" style="text-align:center;margin-top:18px">Nada mais planejado por agora.</p><div class="session-actions"><button class="btn lg primary" id="se-close">Fechar</button></div>`}`);
  box.querySelector("#se-close").onclick = () => { stop(); };
  const n = box.querySelector("#se-next");
  if (n) n.onclick = () => { stop(); startFocusWith(nxt.item); };
}

function showChip() {
  if (!load() || $("#fx-chip")) return;
  const b = document.createElement("button");
  b.id = "fx-chip"; b.className = "btn primary fx-chip"; b.innerHTML = `${icon("timer")} Sessão em andamento`;
  b.onclick = () => { b.remove(); renderSession(); };
  document.body.appendChild(b);
}
