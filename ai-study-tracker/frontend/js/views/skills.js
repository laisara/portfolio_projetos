import { api, esc, icon, pct, skeleton } from "../core.js";

function radar(items, size = 340) {
  const n = items.length, cx = size / 2, cy = size / 2, R = size / 2 - 70;
  const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const poly = (vals) => vals.map((v, i) => pt(i, R * v).map((x) => x.toFixed(1)).join(",")).join(" ");
  const rings = [0.25, 0.5, 0.75, 1].map((f) => `<polygon points="${poly(items.map(() => f))}" fill="none" stroke="var(--border)" stroke-width="1"/>`).join("");
  const axes = items.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--border)"/>`; }).join("");
  const labels = items.map((c, i) => {
    const [x, y] = pt(i, R + 18);
    const anchor = Math.abs(x - cx) < 8 ? "middle" : x > cx ? "start" : "end";
    const short = c.short || c.label;
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle">${esc(short)}</text>`;
  }).join("");
  return `<svg class="radar" viewBox="-50 0 ${size + 100} ${size}" width="100%" style="max-width:${size + 100}px" role="img" aria-label="Radar de competências">
    ${rings}${axes}
    <polygon points="${poly(items.map((c) => c.baseline))}" fill="rgba(255,255,255,.04)" stroke="var(--text-3)" stroke-dasharray="3 3"/>
    <polygon points="${poly(items.map((c) => c.level))}" fill="rgba(139,147,255,.18)" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
    ${items.map((c, i) => { const [x, y] = pt(i, R * c.level); return `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent)"/>`; }).join("")}
    ${labels}</svg>`;
}

export default async function skills(el) {
  el.innerHTML = skeleton(500);
  const { competencies: cs } = await api("/competencies");
  const W = { content: "Cursos", review: "Revisões" };
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">Programação/Automação → AI Engineering → AI Agent Engineering → AI Systems</p><h1>Mapa de competências</h1></div></div>
  <div class="grid grid-2">
    <section class="panel">
      ${cs.map((c) => `<div class="skill">
        <span style="font-weight:500">${esc(c.label)}</span><b class="num">${pct(c.level)}</b>
        <div class="bar" title="Base (conhecimento prévio): ${pct(c.baseline)}"><i style="width:${c.level * 100}%"></i><span class="base" style="width:${c.baseline * 100}%"></span></div>
        <div class="why">${c.baseline ? `base ${pct(c.baseline)} · ` : ""}${Object.entries(c.parts).map(([k, v]) => `${W[k]} ${pct(v)}`).join(" · ") || "sem evidências ainda"}${c.courses_total ? ` · ${c.courses_done}/${c.courses_total} cursos` : ""}</div></div>`).join("")}
    </section>
    <div class="stack">
      <section class="panel" style="display:grid;place-items:center">${radar(cs)}
        <div class="legend" style="margin-top:6px"><span><span class="dot" style="background:var(--accent)"></span>Atual</span><span><span class="dot" style="background:var(--text-3)"></span>Ponto de partida (experiência prévia)</span></div></section>
      <section class="panel"><h2 style="margin-bottom:10px">Como é calculado</h2>
        <p class="muted" style="margin:0 0 10px;font-size:13px">Cada competência parte de um ponto de partida <b>estimado e editável</b> (Ajustes) — não é um fato medido — e evolui com evidências reais de estudo. A classificação dos cursos por competência é do sistema (INFERIDA).</p>
        <div class="mini-list"><div><span class="dot k-video"></span>Cursos concluídos da competência<span class="spacer"></span><b>80%</b></div>
        <div><span class="dot k-review"></span>Revisões em dia<span class="spacer"></span><b>20%</b></div></div></section>
    </div>
  </div>`;
}
