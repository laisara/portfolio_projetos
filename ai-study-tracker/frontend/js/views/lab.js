import { api, esc, skeleton, toast } from "../core.js";

const ST = [["todo", "A fazer"], ["doing", "Fazendo"], ["done", "Feito"]];

export default async function lab(el) {
  el.innerHTML = skeleton(400);
  const { stages } = await api("/lab");
  const done = stages.filter((s) => s.status === "done").length;
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">Progressão prática paralela à formação</p><h1>AI Agent Lab</h1>
    <p class="muted" style="margin:8px 0 0;max-width:640px">Nove etapas do LLM ao projeto final. Para cada uma, uma prática sua, fora dos vídeos.</p></div><span class="chip">${done}/${stages.length} etapas</span></div>
  <div class="panel glass flush">${stages.map((s) => `<div class="lab-row"><span class="track-num ${s.status === "done" ? "ok" : ""}">${s.ord}</span>
    <div style="min-width:0"><div style="font-weight:600">${esc(s.title)}</div><div class="muted" style="font-size:13px;margin-top:2px">${esc(s.description)}</div>
      <div class="faint" style="font-size:12.5px;margin-top:6px">Prática: ${esc(s.practice)}</div></div>
    <div class="seg" role="group" aria-label="Status de ${esc(s.title)}">${ST.map(([k, l]) => `<button data-stage="${s.id}" data-st="${k}" aria-pressed="${s.status === k}">${l}</button>`).join("")}</div></div>`).join("")}</div>`;
  el.querySelectorAll("[data-stage]").forEach((b) => b.onclick = async () => {
    try { await api(`/lab/stages/${b.dataset.stage}`, { method: "PATCH", body: { status: b.dataset.st } }); lab(el); }
    catch (e) { toast(e.message, { type: "error" }); }
  });
}
