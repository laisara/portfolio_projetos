import { $, api, esc, icon, ring, toast } from "./core.js";
import { openFocusPicker, resumeFocusIfAny } from "./focus.js";
import dashboard from "./views/dashboard.js";
import calendar from "./views/calendar.js";
import catalog from "./views/catalog.js";
import course from "./views/course.js";
import skills from "./views/skills.js";
import achievements from "./views/achievements.js";
import sessions from "./views/sessions.js";
import plan from "./views/plan.js";
import settings from "./views/settings.js";

const NAV = [
  { group: "Estudo" },
  { path: "/", label: "Painel", icon: "layout-dashboard", view: dashboard, key: "1" },
  { path: "/calendar", label: "Calendário", icon: "calendar-days", view: calendar, key: "2" },
  { path: "/catalog", label: "Formação", icon: "book-open", view: catalog, key: "3" },
  { path: "/sessions", label: "Sessões", icon: "history", view: sessions, key: "4" },
  { group: "Evolução" },
  { path: "/skills", label: "Competências", icon: "radar", view: skills, key: "5" },
  { path: "/achievements", label: "Conquistas", icon: "trophy", view: achievements, key: "6" },
  { group: "Sistema" },
  { path: "/plan", label: "Planejamento", icon: "target", view: plan, key: "7" },
  { path: "/settings", label: "Ajustes", icon: "settings", view: settings, key: "8" },
];
const ROUTES = [
  ...NAV.filter((n) => n.path),
  { path: /^\/course\/(.+)$/, view: course, parent: "/catalog" },
];

function renderNav(active) {
  $("#nav").innerHTML = NAV.map((n) => n.group
    ? `<div class="nav-label">${n.group}</div>`
    : `<a href="#${n.path}" title="${n.label}" ${n.path === active ? 'aria-current="page"' : ""}>${icon(n.icon)}<span>${n.label}</span><span class="kbd">${n.key}</span></a>`).join("");
}

export async function refreshChrome() {
  try {
    const g = await api("/dashboard");
    $("#sidebar-foot").innerHTML = `<a class="level-mini" href="#/achievements">${ring(g.level_pct)}<div><b>${esc(g.level.name)}</b><span>${g.xp.toLocaleString("pt-BR")} XP · ${g.streak.current}d seguidos</span></div></a>`;
  } catch { /* offline */ }
}

let current = null;
export async function route() {
  const path = (location.hash || "#/").slice(1) || "/";
  let match = null, params = [];
  for (const r of ROUTES) {
    if (typeof r.path === "string" ? r.path === path : r.path.test(path)) {
      match = r;
      params = typeof r.path === "string" ? [] : path.match(r.path).slice(1).map(decodeURIComponent);
      break;
    }
  }
  if (path === "/focus") { location.hash = "#/"; openFocusPicker(); return; }
  if (!match) match = ROUTES[0];
  renderNav(match.parent || (typeof match.path === "string" ? match.path : "/"));
  const el = $("#view");
  el.className = "view";
  void el.offsetWidth;
  current = match;
  try {
    await match.view(el, ...params);
  } catch (err) {
    el.innerHTML = `<div class="panel">${icon("triangle-alert")} <b>Não foi possível carregar.</b><p class="muted">${esc(err.message)}</p><button class="btn" onclick="location.reload()">Tentar novamente</button></div>`;
  }
  el.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
  refreshChrome();
}
export const rerender = () => route();

window.addEventListener("hashchange", route);
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey || $("#overlay").innerHTML) return;
  const n = NAV.find((x) => x.key === e.key);
  if (n) location.hash = `#${n.path}`;
  if (e.key === "f") openFocusPicker();
});
window.addEventListener("study:changed", () => { if (!$(".focus")) route(); });

async function boot() {
  try {
    const svg = await (await fetch("/icons/sprite.svg")).text();
    $("#sprite").innerHTML = svg;
  } catch { /* offline sem cache */ }
  await route();
  resumeFocusIfAny();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("SW", e));
  }
}
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); window.__installPrompt = e; window.dispatchEvent(new Event("pwa:installable")); });
window.addEventListener("appinstalled", () => toast("App instalado! Abra pelo ícone no Menu Iniciar ou na área de trabalho.", { type: "good" }));
boot();
