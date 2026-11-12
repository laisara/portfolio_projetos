import { $, api, closeLayer, esc, icon, openLayer, ring, toast } from "./core.js";
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
import reviews from "./views/reviews.js";
import projects from "./views/projects.js";
import lab from "./views/lab.js";

const NAV = [
  { path: "/", label: "Hoje", icon: "layout-dashboard", view: dashboard, key: "1", tab: true },
  { path: "/calendar", label: "Cronograma", icon: "calendar-days", view: calendar, key: "2", tab: true },
  { path: "/catalog", label: "Trilhas", icon: "book-open", view: catalog, key: "3", tab: true },
  { path: "/projects", label: "Projetos", icon: "hammer", view: projects, key: "4" },
  { path: "/reviews", label: "Revisões", icon: "repeat", view: reviews, key: "5", tab: true },
  { path: "/lab", label: "AI Agent Lab", icon: "flask-conical", view: lab, key: "6" },
  { path: "/achievements", label: "Progresso", icon: "trophy", view: achievements, key: "7" },
  { group: "Mais" },
  { path: "/sessions", label: "Sessões", icon: "history", view: sessions, key: "8", more: true },
  { path: "/skills", label: "Competências", icon: "radar", view: skills, key: "9", more: true },
  { path: "/plan", label: "Planejamento", icon: "target", view: plan, more: true },
  { path: "/settings", label: "Ajustes e dados", icon: "settings", view: settings, more: true },
];
const ROUTES = [
  ...NAV.filter((n) => n.path),
  { path: /^\/course\/(.+)$/, view: course, parent: "/catalog" },
];

function renderNav(active) {
  $("#nav").innerHTML = NAV.map((n) => n.group
    ? `<div class="nav-label">${n.group}</div>`
    : `<a href="#${n.path}" title="${n.label}" ${n.path === active ? 'aria-current="page"' : ""}>${icon(n.icon)}<span>${n.label}</span>${n.key ? `<span class="kbd">${n.key}</span>` : ""}</a>`).join("");
  const tabs = NAV.filter((n) => n.tab);
  $("#tabbar").innerHTML = tabs.map((n) => `<a href="#${n.path}" ${n.path === active ? 'aria-current="page"' : ""}>${icon(n.icon)}<span>${n.label}</span></a>`).join("")
    + `<button id="tab-more" aria-label="Mais opções">${icon("menu")}<span>Mais</span></button>`;
  $("#tab-more").onclick = () => {
    const box = openLayer(`<div class="drawer-head"><h2>Mais</h2><button class="btn ghost icon-only" data-close aria-label="Fechar">${icon("x")}</button></div>
      <nav class="nav">${NAV.filter((n) => n.path && !n.tab).map((n) => `<a href="#${n.path}">${icon(n.icon)}<span>${n.label}</span></a>`).join("")}</nav>`, { kind: "drawer", label: "Mais" });
    box.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeLayer));
  };
}

export async function refreshChrome() {
  try {
    const g = await api("/dashboard");
    $("#sidebar-foot").innerHTML = `<a class="level-mini" href="#/achievements">${ring(g.level_pct)}<div><b>${esc(g.level.name)}</b><span>${g.xp.toLocaleString("pt-BR")} XP · ${g.streak.current}d seguidos</span></div></a>`;
    const ml = $("#mobile-level"); if (ml) ml.innerHTML = `${icon("zap", "icon icon-sm")} ${g.xp.toLocaleString("pt-BR")} XP`;
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
  const n = NAV.find((x) => x.key && x.key === e.key);
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
