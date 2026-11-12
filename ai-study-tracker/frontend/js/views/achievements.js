import { api, bar, esc, fmtDate, icon, pct, skeleton } from "../core.js";

export default async function achievements(el) {
  el.innerHTML = skeleton(500);
  const g = await api("/gamification");
  const r = g.rules;
  const maxRate = Math.max(...Object.values(r.per_min));
  const unlocked = g.achievements.filter((a) => a.unlocked).length;
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">XP · nível · conquistas</p><h1>Progresso</h1></div><span class="chip">${icon("flame")} melhor sequência: ${g.streak.best} dias</span></div>
  <section class="panel">
    <div class="level-hero">
      <div class="level-badge">${g.level.id}</div>
      <div><p class="eyebrow">Nível atual</p><h1 style="font-size:30px">${esc(g.level.name)}</h1><p class="muted" style="margin:4px 0 14px">${esc(g.level.tagline)}</p>
        <div class="row" style="gap:14px">${bar(g.level_pct, "", "thick")}<b class="num">${g.xp.toLocaleString("pt-BR")} XP</b></div>
        <p class="faint num" style="font-size:12.5px;margin:8px 0 0">${g.next_level ? `${(g.next_level.xp - g.xp).toLocaleString("pt-BR")} XP para ${esc(g.next_level.name)} (${g.next_level.xp.toLocaleString("pt-BR")})` : "Nível máximo alcançado."}</p></div>
    </div>
    <div class="ladder" style="margin-top:22px">${g.levels.map((l) => `<div class="${g.xp >= l.xp ? "reached" : ""} ${l.id === g.level.id ? "current" : ""}"><b>${esc(l.name)}</b><span class="num">${l.xp.toLocaleString("pt-BR")} XP</span></div>`).join("")}</div>
  </section>

  <section class="section"><div class="section-head"><span class="label">Conquistas · ${unlocked}/${g.achievements.length}</span></div>
    <div class="ach-grid">${g.achievements.map((a) => `<div class="ach ${a.unlocked ? "on" : ""}"><div class="ic">${icon(a.unlocked ? a.icon : "lock")}</div>
      <div><b>${esc(a.title)}</b><p>${esc(a.description)}</p><p class="num" style="color:${a.unlocked ? "var(--warn)" : "var(--text-3)"}">+${a.xp} XP${a.unlocked_on ? ` · ${fmtDate(a.unlocked_on)}` : ""}</p></div></div>`).join("")}</div></section>

  <div class="grid grid-2 section">
    <section class="panel"><h2>Regras de XP — fazer &gt; assistir</h2><p class="faint" style="font-size:12.5px;margin:4px 0 14px">XP por minuto registrado em sessão</p>
      ${[["VIDEO", "Aula", "k-video"], ["REVIEW", "Revisão", "k-review"], ["PRACTICE", "Prática (manual)", "k-practice"], ["PROJECT", "Projeto (manual)", "k-project"]].map(([k, l, c]) =>
        `<div class="xp-rule"><span><span class="dot ${c}" style="display:inline-block;margin-right:8px"></span>${l}</span>${bar(r.per_min[k] / maxRate, c, "", l)}<b class="num" style="text-align:right">${r.per_min[k]}×/min</b></div>`).join("")}
      <hr class="divider"><div class="mini-list">
        <div>Aula concluída<span class="spacer"></span><b class="num">+${r.lesson}</b></div>
        <div>Revisão no prazo / atrasada<span class="spacer"></span><b class="num">+${r.review_on_time} / +${r.review_late}</b></div>
        <div>Curso concluído (todas as aulas)<span class="spacer"></span><b class="num">+${r.content}</b></div>
        <div>Trilha concluída<span class="spacer"></span><b class="num">+${r.track}</b></div>
        <div>Item de checklist / projeto concluído<span class="spacer"></span><b class="num">+${r.project_item} / +${r.project}</b></div></div></section>
    <section class="panel"><h2 style="margin-bottom:12px">Histórico de XP</h2>
      ${g.ledger.length ? `<div class="mini-list">${g.ledger.slice(0, 18).map((e) => `<div><span class="faint num" style="min-width:42px">${e.date ? fmtDate(e.date) : "—"}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.label)}</span><span class="spacer"></span><b class="num" style="color:var(--warn)">+${Math.round(e.xp)}</b></div>`).join("")}</div>`
        : `<div class="empty">${icon("zap")}<b>Nenhum XP ainda</b>Comece uma sessão para ganhar os primeiros pontos.</div>`}</section>
  </div>`;
}
