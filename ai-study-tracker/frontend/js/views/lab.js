import { api, bar, esc, fmtDate, hm, icon, pct, skeleton } from "../core.js";

export const STATUS = { locked: "Bloqueado", available: "Disponível", in_progress: "Em andamento", done: "Concluído" };
const STATUS_CHIP = { locked: "", available: "accent", in_progress: "warn", done: "good" };
export const statusChip = (s) => `<span class="chip ${STATUS_CHIP[s]}">${s === "locked" ? `${`<svg class="icon" aria-hidden="true"><use href="#i-lock"/></svg>`}` : ""}${STATUS[s]}</span>`;

export default async function lab(el) {
  el.innerHTML = skeleton(600);
  const { stages } = await api("/lab");
  const done = stages.filter((s) => s.effective_status === "done").length;
  const totalH = stages.reduce((a, s) => a + s.planned_min, 0);
  const worked = stages.reduce((a, s) => a + s.worked_min, 0);
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">Laboratório permanente</p><h1>AI Agent Lab</h1>
    <p class="muted" style="margin:8px 0 0;max-width:640px">A ponte entre <b>curso → prática → projeto real</b>. Cada estágio é liberado quando o curso-gatilho termina e é planejado principalmente nos sábados (dia de projeto).</p></div>
    <div class="row"><span class="chip">${done}/${stages.length} estágios</span><span class="chip num">${hm(worked, { compact: true })} / ${hm(totalH, { compact: true })}</span></div></div>
  <div class="panel" style="margin-bottom:24px"><div class="row wrap" style="gap:6px">${["Fundamentos", "Prompt", "API", "AI Build", "Tool Calling", "Agent", "RAG", "Multi-Agent", "AI App", "Final"].map((x, i, a) => `<span class="faint" style="font-size:12.5px">${x}</span>${i < a.length - 1 ? icon("chevron-right", "icon icon-sm faint") : ""}`).join("")}</div></div>
  <div class="timeline">${stages.map((s) => `
    <div class="stage ${s.effective_status}">
      <div class="stage-node">${s.effective_status === "done" ? icon("check", "icon icon-sm") : s.ord}</div>
      <a class="stage-card" href="#/lab/${s.id}">
        <div class="row wrap"><span class="id-tag">${s.id}</span><h3>${esc(s.title)}</h3><span class="faint" style="font-size:12.5px">${esc(s.subtitle || "")}</span><span class="spacer"></span>${statusChip(s.effective_status)}</div>
        <p class="muted" style="margin:8px 0 12px;font-size:13px;max-width:720px">${esc(s.objective)}</p>
        <div class="row" style="gap:14px">${bar(s.pct, "k-project")}<span class="num" style="font-weight:600;min-width:40px;text-align:right">${pct(s.pct)}</span></div>
        <div class="row wrap faint" style="font-size:12px;margin-top:10px;gap:14px">
          <span>${icon("clock", "icon icon-sm")} ${hm(s.planned_min)} planejadas</span>
          <span>${icon("lock", "icon icon-sm")} após: ${esc(s.unlock_title)}</span>
          ${s.plan ? `<span>${icon("calendar-days", "icon icon-sm")} ${fmtDate(s.plan.first)} → ${fmtDate(s.plan.last)}</span>` : ""}
          <span>${icon("target", "icon icon-sm")} ${s.milestones.filter((m) => m.done_on).length}/${s.milestones.length} milestones</span>
        </div>
      </a>
    </div>`).join("")}</div>`;
}
