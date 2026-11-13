import { api, esc, fmtDate, hm, icon, isoDate, KIND, MON3, MONTHS, openLayer, parseDate, skeleton, toast, TYPE_LABEL, TYPE_KIND, WEEK } from "../core.js";
import { bindStart, taskRow } from "./dashboard.js";

const ORDER = ["video", "practice", "project", "review"];
let cursor = null;
let mode = null;

function lines(day) {
  return ORDER.filter((k) => day.planned[k]).map((k) =>
    `<div><span class="dot ${KIND[k].cls}"></span>${hm(day.planned[k], { compact: true })} ${KIND[k].label.toLowerCase()}</div>`).join("");
}
function miniStack(day) {
  const tot = day.planned_total || 1;
  return `<span class="mini-stack">${ORDER.filter((k) => day.planned[k]).map((k) => `<i class="${KIND[k].cls}" style="width:${(day.planned[k] / tot) * 100}%"></i>`).join("")}</span>`;
}

function cell(day, monthIdx) {
  const d = parseDate(day.date);
  const out = d.getMonth() !== monthIdx;
  const done = day.past && day.planned_total && day.actual_total >= day.planned_total * 0.8;
  const cls = ["cal-day", out && "out", day.is_today && "today", day.rest && "rest", !day.in_plan && "off-plan"].filter(Boolean).join(" ");
  const label = `${d.getDate()} ${MONTHS[d.getMonth()]}: ${day.rest ? "descanso" : hm(day.planned_total) + " planejado"}`;
  return `<button class="${cls}" data-date="${day.date}" aria-label="${esc(label)}">
    <span class="d-num"><span>${d.getDate()}${done ? `<span class="done-badge" title="Realizado">${icon("circle-check", "icon icon-sm")}</span>` : ""}</span><span class="mon">${d.getDate() === 1 || day.is_today ? MON3[d.getMonth()] : ""}</span></span>
    ${day.rest ? `<span class="rest-label">${icon("coffee", "icon icon-sm")}<span>Descanso</span></span>`
      : day.planned_total ? `<div class="cal-lines">${lines(day)}</div>${miniStack(day)}
        ${day.is_today && day.actual_total ? `<div class="cal-actual">✓ ${hm(day.actual_total, { compact: true })} feitos</div>` : ""}
        <div class="cal-total"><span>${day.is_today && day.actual_total ? "RESTA" : "TOTAL"}</span><b class="num">${hm(day.planned_total, { compact: true })}</b></div>`
      : day.actual_total ? `<div class="cal-total"><span>REAL</span><b class="num">${hm(day.actual_total, { compact: true })}</b></div>` : ""}
  </button>`;
}

function openDay(day) {
  const d = parseDate(day.date);
  const box = openLayer(`
    <div class="drawer-head"><div><p class="eyebrow">${WEEK[(d.getDay() + 6) % 7]}${day.holiday ? " · data especial" : ""}</p>
      <h2>${d.getDate()} de ${MONTHS[d.getMonth()]}</h2></div>
      <button class="btn ghost icon-only" data-close aria-label="Fechar">${icon("x")}</button></div>
    ${day.rest ? `<div class="notice info">${icon("coffee")}<div><b>Descanso completo.</b> Sem aulas, exercícios, revisão ou projeto. O descanso faz parte da consolidação.</div></div>` : ""}
    ${day.items.length ? `<div class="row" style="margin-bottom:8px"><span class="eyebrow" style="margin:0">${day.past ? "Planejado (foto do dia)" : "Planejado"}</span><span class="spacer"></span><b class="num">${hm(day.planned_total)}</b></div>
      ${day.items.map((i) => taskRow(i, { startable: day.is_today })).join("")}` : !day.rest ? `<p class="muted">Nada planejado.</p>` : ""}
    ${day.sessions.length ? `<hr class="divider"><div class="row" style="margin-bottom:8px"><span class="eyebrow" style="margin:0">Realizado</span><span class="spacer"></span><b class="num">${hm(day.actual_total)}</b></div>
      ${day.sessions.map((s) => `<div class="task ${KIND[TYPE_KIND[s.type]]?.cls || "k-other"}"><span class="rail"></span><div><div class="t-title">${esc(s.title)}</div>
      <div class="t-meta"><span>${TYPE_LABEL[s.type]}</span><span class="num">plan. ${hm(s.planned_min)} · real ${hm(s.actual_min)}</span></div></div></div>`).join("")}` : ""}`,
    { kind: "drawer", label: `Dia ${fmtDate(day.date)}` });
  bindStart(box);
  if (!day.past && day.in_plan) {
    const manual = day.holiday && day.rest;      // dia que já virou descanso por data especial/adiamento
    const btn = document.createElement("button");
    btn.className = "btn " + (manual ? "" : "ghost"); btn.style.cssText = "margin-top:16px;width:100%";
    btn.innerHTML = manual ? `${icon("rotate-ccw")} Voltar a estudar neste dia` : `${icon("coffee")} Adiar este dia (descansar)`;
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        const cfg = await api("/settings");
        const holidays = { ...cfg.holidays };
        if (manual) delete holidays[day.date]; else holidays[day.date] = 0;
        const r = await api("/settings", { method: "PUT", body: { holidays } });
        toast(`${manual ? "Dia reativado" : "Dia adiado"} · novo término das revisões: ${fmtDate(r.end, "full")}`, { type: "good" });
        document.querySelector("#overlay").innerHTML = "";
        window.dispatchEvent(new Event("study:changed"));
      } catch (e) { btn.disabled = false; toast(e.message, { type: "error" }); }
    };
    box.appendChild(btn);
  }
}

export default async function calendar(el) {
  mode = mode || (matchMedia("(max-width: 820px)").matches ? "month" : "month");
  const health = await api("/health");
  const today = parseDate(health.today);
  const settings = await api("/settings");
  const start = parseDate(settings.start_date);
  if (!cursor) cursor = new Date(Math.max(today, start).valueOf());
  cursor.setDate(1);
  el.innerHTML = `<div class="page-head"><div><p class="eyebrow">Aula → prática → projeto → revisão</p><h1>Calendário</h1></div>
    <div class="row wrap">
      <div class="seg" role="group" aria-label="Visualização"><button data-mode="month" aria-pressed="${mode === "month"}">Mês</button><button data-mode="agenda" aria-pressed="${mode === "agenda"}">Agenda</button></div>
      <div class="cal-toolbar"><button class="btn icon-only" id="prev" aria-label="Mês anterior">${icon("chevron-left")}</button>
      <span class="cal-title" id="cal-title"></span>
      <button class="btn icon-only" id="next" aria-label="Próximo mês">${icon("chevron-right")}</button>
      <button class="btn" id="today">Hoje</button>
      <button class="btn" id="adjust" title="Recalcula o futuro a partir de hoje (dia perdido, atraso ou adiantamento)">${icon("refresh-cw")} Ajustar cronograma</button></div>
    </div></div>
    <div class="legend" style="margin-bottom:14px">${["video", "practice", "project", "review"].map((k) => `<span><span class="dot ${KIND[k].cls}"></span>${KIND[k].label}</span>`).join("")}<span><span class="dot k-rest" style="background:var(--c-rest);outline:1px solid var(--border-2)"></span>Descanso</span></div>
    <div id="cal-body">${skeleton(600)}</div>`;
  const body = el.querySelector("#cal-body");

  async function draw() {
    const m = cursor.getMonth();
    el.querySelector("#cal-title").textContent = `${MONTHS[m]} ${cursor.getFullYear()}`;
    if (mode === "month") {
      const first = new Date(cursor); const offset = (first.getDay() + 6) % 7;
      const gridStart = new Date(first); gridStart.setDate(1 - offset);
      const gridEnd = new Date(gridStart); gridEnd.setDate(gridStart.getDate() + 41);
      const data = await api(`/calendar?start=${isoDate(gridStart)}&end=${isoDate(gridEnd)}`);
      let days = data.days;
      while (days.length > 35 && days.slice(-7).every((x) => parseDate(x.date).getMonth() !== m)) days = days.slice(0, -7);
      body.innerHTML = `<div class="cal">${["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((w) => `<div class="cal-dow">${w}</div>`).join("")}
        ${days.map((x) => cell(x, m)).join("")}</div>
        <p class="faint" style="font-size:12.5px;margin-top:12px">Plano: ${fmtDate(data.plan_start, "full")} → ${fmtDate(data.plan_end, "full")}. Dias passados mostram a foto do plano daquele dia e o realizado; o futuro é recalculado a cada sessão.</p>`;
      body.querySelectorAll(".cal-day").forEach((b) => b.onclick = () => openDay(days.find((x) => x.date === b.dataset.date)));
    } else {
      const s = new Date(cursor); const e = new Date(cursor.getFullYear(), m + 1, 0);
      const data = await api(`/calendar?start=${isoDate(s)}&end=${isoDate(e)}`);
      const days = data.days.filter((x) => x.planned_total || x.actual_total || (x.rest && x.in_plan));
      body.innerHTML = days.length ? `<div class="panel">${days.map((x) => {
        const d = parseDate(x.date);
        return `<div class="agenda-day ${x.is_today ? "today" : ""}"><div class="agenda-date"><b>${String(d.getDate()).padStart(2, "0")}</b><span>${WEEK[(d.getDay() + 6) % 7].slice(0, 3)}</span></div>
          <div>${x.rest ? `<div class="rest-label">${icon("coffee", "icon icon-sm")} Descanso</div>` : `${x.items.map((i) => taskRow(i, { startable: x.is_today })).join("")}
          <div class="row" style="justify-content:flex-end;font-size:12px;color:var(--text-3);margin-top:6px">TOTAL&nbsp;<b class="num" style="color:var(--text);font-size:14px">${hm(x.planned_total, { compact: true })}</b>${x.actual_total ? `&nbsp;· real ${hm(x.actual_total, { compact: true })}` : ""}</div>`}</div></div>`;
      }).join("")}</div>` : `<div class="panel"><p class="muted">Nada planejado neste mês.</p></div>`;
      bindStart(body);
    }
  }
  el.querySelector("#prev").onclick = () => { cursor.setMonth(cursor.getMonth() - 1); draw(); };
  el.querySelector("#next").onclick = () => { cursor.setMonth(cursor.getMonth() + 1); draw(); };
  el.querySelector("#adjust").onclick = async () => { try { const r = await api("/plan/recalculate", { method: "POST" }); toast(`Cronograma ajustado · última atividade ${fmtDate(r.end_date, "full")}`, { type: "good" }); await draw(); } catch (e) { toast(e.message, { type: "error" }); } };
  el.querySelector("#today").onclick = () => { cursor = new Date(today); cursor.setDate(1); draw(); };
  el.querySelectorAll("[data-mode]").forEach((b) => b.onclick = () => { mode = b.dataset.mode; calendar(el); });
  await draw();
}
