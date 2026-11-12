import { api, bar, esc, hm, icon, pct, rewardToast, skeleton, toast } from "../core.js";
import { startFocusWith } from "../focus.js";

const ST = { todo: ["A fazer", ""], doing: ["Em andamento", "warn"], done: ["Concluído", "good"] };

export default async function projects(el) {
  el.innerHTML = skeleton(400);
  const { projects: list } = await api("/projects");
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">Transforme conteúdo em habilidade</p><h1>Projetos</h1>
    <p class="muted" style="margin:8px 0 0;max-width:640px">Uma lista simples de projetos seus, liberados conforme a formação avança. O tempo planejado entra no cronograma aos sábados.</p></div></div>
  <div class="stack">${list.map((p) => `<section class="panel glass ${p.unlocked ? "" : "locked"}">
    <div class="row wrap" style="gap:10px"><span class="id-tag">${esc(p.id)}</span><h2 style="font-size:17px">${esc(p.title)}</h2><span class="spacer"></span>
      <span class="chip ${ST[p.status][1]}">${ST[p.status][0]}</span></div>
    <p class="muted" style="margin:8px 0 14px;font-size:13.5px">${esc(p.description)}</p>
    <div class="row" style="gap:14px">${bar(p.progress, "", "", p.title)}<b class="num">${pct(p.progress)}</b></div>
    <div class="checklist" style="margin-top:12px">${p.items.map((i) => `<div class="${i.done_on ? "done" : ""}"><button class="check" role="checkbox" aria-checked="${!!i.done_on}" data-item="${i.id}" aria-label="${esc(i.title)}">${icon("check")}</button><span class="txt">${esc(i.title)}</span></div>`).join("")}</div>
    <div class="row wrap faint" style="font-size:12.5px;margin-top:12px;gap:14px"><span>${icon("clock", "icon icon-sm")} ${hm(p.worked_min)} de ${hm(p.planned_min)} planejadas</span>
      <span>${p.unlocked ? "disponível" : `libera após: ${esc(p.unlock_title || "")}`}</span><span class="spacer"></span>
      ${p.status !== "done" ? `<button class="btn sm" data-start='${esc(JSON.stringify({ kind: "project", ref: p.id, title: p.title, minutes: Math.min(90, Math.max(25, p.planned_min - p.worked_min)), phase: "PROJETO", detail: { course: "Projetos" } }))}'>${icon("play")} Sessão de projeto</button>` : ""}</div>
  </section>`).join("")}</div>`;
  el.querySelectorAll("[data-item]").forEach((b) => b.onclick = async () => {
    b.disabled = true;
    try { const r = await api(`/projects/items/${b.dataset.item}/toggle`, { method: "POST" }); rewardToast(r, "Checklist atualizado"); window.dispatchEvent(new Event("study:changed")); }
    catch (e) { b.disabled = false; toast(e.message, { type: "error" }); }
  });
  el.querySelectorAll("[data-start]").forEach((b) => b.onclick = () => startFocusWith(JSON.parse(b.dataset.start)));
}
