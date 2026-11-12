import { api, empty, esc, fmtDate, hm, icon, rewardToast, skeleton, toast } from "../core.js";

export default async function reviews(el) {
  el.innerHTML = skeleton(300);
  const r = await api("/reviews/today");
  const row = (x, due) => `<div class="review-row"><span class="chip k-review" style="color:var(--c-review)">D+${x.interval}</span>
    <div style="min-width:0"><div style="font-weight:500">${x.courses.length ? x.courses.map(esc).join(" · ") : "Conteúdo estudado em " + fmtDate(x.learned_on)}</div>
      <div class="faint" style="font-size:12.5px">estudado em ${fmtDate(x.learned_on)} · ${hm(x.minutes)}${due ? "" : ` · vence ${fmtDate(x.due)}`}</div></div>
    ${due ? `<button class="btn primary sm" data-review="${esc(x.key)}">${icon("check")} Marcar como revisado</button>` : ""}</div>`;
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">Repetição espaçada · D+1 · D+7 · D+30</p><h1>Revisões de hoje</h1></div>
    ${r.due.length > 1 ? `<button class="btn" id="all">${icon("check")} Marcar todas</button>` : ""}</div>
  <section class="panel glass">
    ${r.due.length ? `<div class="panel-head"><h2>${r.due.length} para revisar</h2><span class="faint">≈ ${hm(r.minutes)} no total</span></div>${r.due.map((x) => row(x, true)).join("")}`
      : empty("circle-check", r.done_today ? "Revisões de hoje concluídas" : "Nenhuma revisão pendente", r.done_today ? `${r.done_today} feita(s) hoje.` : "Elas aparecem 1, 7 e 30 dias depois de concluir uma aula.")}
  </section>
  ${r.upcoming.length ? `<section class="section"><div class="section-head"><span class="label">Próximas</span></div><div class="panel glass">${r.upcoming.map((x) => row(x, false)).join("")}</div></section>` : ""}
  <p class="faint" style="font-size:12.5px;margin-top:14px">Revisões são pequenas: reveja só o essencial, sem reassistir a aula inteira.</p>`;
  const mark = async (key) => { const res = await api(`/reviews/${encodeURIComponent(key)}/done`, { method: "POST" }); rewardToast(res, "Revisado"); };
  el.querySelectorAll("[data-review]").forEach((b) => b.onclick = async () => { b.disabled = true; try { await mark(b.dataset.review); window.dispatchEvent(new Event("study:changed")); } catch (e) { b.disabled = false; toast(e.message, { type: "error" }); } });
  el.querySelector("#all")?.addEventListener("click", async () => { try { for (const x of r.due) await mark(x.key); window.dispatchEvent(new Event("study:changed")); } catch (e) { toast(e.message, { type: "error" }); } });
}
