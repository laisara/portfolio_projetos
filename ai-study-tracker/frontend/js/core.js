// Utilitários compartilhados: API, formatação, ícones, toasts, modais.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
export const icon = (name, cls = "icon") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

// ---------------------------------------------------------------- API
const CACHE_PREFIX = "ast:get:";
export async function api(path, { method = "GET", body, form } = {}) {
  const opts = { method, headers: {} };
  if (form) opts.body = form;
  else if (body !== undefined) { opts.body = JSON.stringify(body); opts.headers["Content-Type"] = "application/json"; }
  let res;
  try {
    res = await fetch(`/api${path}`, opts);
  } catch (err) {
    document.body.classList.add("offline");
    if (method === "GET") {
      const cached = readCache(path);
      if (cached) return cached;
    }
    throw new Error("Servidor local indisponível. Verifique se o start.bat está rodando.");
  }
  if (res.headers.get("X-Offline")) {  // service worker sem rede nem cache desta rota
    document.body.classList.add("offline");
    const cached = method === "GET" && readCache(path);
    if (cached) return cached;
    throw new Error("Sem conexão com o servidor local e sem dados salvos para esta tela.");
  }
  document.body.classList.remove("offline");
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const j = await res.json();
      msg = Array.isArray(j.detail) ? j.detail.map((d) => d.msg).join("; ") : j.detail || msg;
    } catch { /* corpo não-JSON */ }
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("json") ? await res.json() : await res.blob();
  if (method === "GET" && ct.includes("json")) writeCache(path, data);
  return data;
}
function readCache(path) { try { return JSON.parse(localStorage.getItem(CACHE_PREFIX + path)); } catch { return null; } }
function writeCache(path, data) { try { localStorage.setItem(CACHE_PREFIX + path, JSON.stringify(data)); } catch { /* quota */ } }

// ---------------------------------------------------------------- formatação
export function hm(min, { zero = "0m", compact = false } = {}) {
  min = Math.round(min || 0);
  if (min <= 0) return zero;
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m}m`;
  if (compact) return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
  return m ? `${h}h ${String(m).padStart(2, "0")}min` : `${h}h`;
}
export const hours = (min) => `${(min / 60).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h`;
export const pct = (x) => `${Math.round((x || 0) * 100)}%`;
export const WEEK = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
export const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const MON3 = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
export function parseDate(iso) { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); }
export function isoDate(dt) { return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`; }
export function wd(iso) { return (parseDate(iso).getDay() + 6) % 7; }
export function fmtDate(iso, style = "short") {
  if (!iso) return "—";
  const d = parseDate(iso);
  if (style === "long") return `${WEEK[wd(iso)]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  if (style === "full") return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const KIND = {
  video: { label: "Aula", phase: "APRENDER", cls: "k-video", type: "VIDEO" },
  practice: { label: "Prática", phase: "CONSTRUIR", cls: "k-practice", type: "PRACTICE" },
  project: { label: "Projeto", phase: "CONSOLIDAR", cls: "k-project", type: "PROJECT" },
  review: { label: "Revisão", phase: "REVISAR", cls: "k-review", type: "REVIEW" },
  rest: { label: "Descanso", phase: "DESCANSO", cls: "k-rest" },
};
export const TYPE_KIND = { VIDEO: "video", PRACTICE: "practice", PROJECT: "project", REVIEW: "review", OTHER: "other" };
export const TYPE_LABEL = { VIDEO: "Vídeo", PRACTICE: "Prática", PROJECT: "Projeto", REVIEW: "Revisão", OTHER: "Outro" };

// ---------------------------------------------------------------- componentes
export const bar = (x, k = "", cls = "") => `<div class="bar ${cls} ${k}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round((x || 0) * 100)}"><i style="width:${Math.min(100, (x || 0) * 100).toFixed(1)}%"></i></div>`;
export function segbar(x, n = 20) {
  const filled = (x || 0) * n;
  return `<div class="segbar" role="progressbar" aria-valuenow="${Math.round(x * 100)}" aria-valuemin="0" aria-valuemax="100">${
    Array.from({ length: n }, (_, i) => `<span class="${i + 1 <= filled ? "on" : i < filled ? "half" : ""}"></span>`).join("")}</div>`;
}
export const verify = (on = true, txt = "VERIFICAR") => (on ? `<span class="verify" title="Informação não visível/legível nos prints">[${txt}]</span>` : "");
export const phaseTag = (kind, phase) => `<span class="phase ${KIND[kind]?.cls || "k-other"}">${esc(phase || KIND[kind]?.phase || kind)}</span>`;
export function ring(x, size = 34, stroke = 3.5, color = "var(--accent)") {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, x || 0))}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}
export const empty = (ic, title, text = "") => `<div class="empty">${icon(ic)}<b>${esc(title)}</b>${esc(text)}</div>`;
export const skeleton = (h = 120) => `<div class="skeleton" style="height:${h}px"></div>`;

// ---------------------------------------------------------------- toasts
export function toast(msg, { type = "", xp = 0, timeout = 3800 } = {}) {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  const ic = type === "error" ? "triangle-alert" : type === "good" ? "circle-check" : "sparkles";
  el.innerHTML = `${icon(ic)}<div style="flex:1">${esc(msg)}</div>${xp ? `<span class="xp">+${xp} XP</span>` : ""}`;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 260); }, timeout);
}
export function rewardToast(r, base = "Salvo") {
  if (!r) return;
  toast(base, { type: "good", xp: r.xp_gained > 0 ? r.xp_gained : 0 });
  (r.new_achievements || []).forEach((a, i) => setTimeout(() => toast(`Conquista desbloqueada: ${a}`, { xp: 0 }), 500 + i * 400));
  if (r.level_up) setTimeout(() => toast(`Novo nível: ${r.level.name}!`, { type: "good", timeout: 6000 }), 300);
}

// ---------------------------------------------------------------- modal/drawer
let lastFocus = null;
export function openLayer(html, { kind = "modal", label = "Diálogo", onClose } = {}) {
  closeLayer();
  lastFocus = document.activeElement;
  const ov = $("#overlay");
  ov.innerHTML = `<div class="scrim" data-close></div><div class="${kind}" role="dialog" aria-modal="true" aria-label="${esc(label)}">${html}</div>`;
  const box = ov.querySelector(`.${kind}`);
  ov.onclick = (e) => { if (e.target.closest("[data-close]")) closeLayer(); };
  ov._onClose = onClose;
  const f = box.querySelector("[autofocus], input, select, textarea, button:not([data-close])");
  setTimeout(() => (f || box).focus?.(), 30);
  return box;
}
export function closeLayer() {
  const ov = $("#overlay");
  if (!ov.innerHTML) return;
  const cb = ov._onClose;
  ov.innerHTML = "";
  ov._onClose = null;
  cb?.();
  lastFocus?.focus?.();
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#overlay").innerHTML && !$(".focus")) closeLayer(); });

export function confirmDialog(title, text, okLabel = "Confirmar") {
  return new Promise((resolve) => {
    let done = false;
    const box = openLayer(`<div class="modal-head"><h2>${esc(title)}</h2></div><p class="muted">${esc(text)}</p>
      <div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ok">${esc(okLabel)}</button></div>`,
      { label: title, onClose: () => { if (!done) resolve(false); } });
    box.querySelector("#ok").onclick = () => { done = true; resolve(true); closeLayer(); };
  });
}

export function busy(btn, on = true) {
  if (!btn) return;
  btn.disabled = on;
  btn.setAttribute("aria-busy", on ? "true" : "false");
}
