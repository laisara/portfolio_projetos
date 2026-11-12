import { api, bar, esc, hm, icon, pct, skeleton, verify } from "../core.js";

let tab = "courses";
const BADGE = { "CONFIRMADO": "good", "INFERIDO": "warn", "A VERIFICAR": "warn", "NÃO IDENTIFICADO": "warn", "ESTIMATIVA DO SISTEMA": "" };
const badge = (txt) => { const key = Object.keys(BADGE).find((k) => (txt || "").startsWith(k)); return `<span class="chip ${BADGE[key] ?? ""}" style="height:20px;font-size:11px">${esc(txt)}</span>`; };

export default async function catalog(el) {
  el.innerHTML = skeleton(500);
  const d = await api("/catalog");
  const a = d.analysis;
  const cell = (label, val, note, extra = "") => `<div><div class="stat-label">${label}</div><div class="stat-value num" ${extra}>${val}</div><div class="faint" style="font-size:12.5px">${note}</div></div>`;
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">${esc(a.name || "Formação")}</p><h1>Catálogo e auditoria de carga</h1></div>
    <div class="seg" role="group" aria-label="Visualização"><button data-tab="courses" aria-pressed="${tab === "courses"}">Cursos</button><button data-tab="tracks" aria-pressed="${tab === "tracks"}">Trilhas</button><button data-tab="audit" aria-pressed="${tab === "audit"}">Auditoria</button></div></div>

  <section class="panel flush" aria-label="De onde vêm as 63 horas">
    <div class="compare" style="grid-template-columns:repeat(4,1fr)">
      ${cell("Carga declarada da formação", hm(a.declared_min, { compact: true }), "informada no cabeçalho do print")}
      ${cell("Carga identificada nos prints", hm(a.identified_gross_min, { compact: true }), `${a.appearances} aparições de ${a.courses} cursos`, 'style="color:var(--green-hover)"')}
      ${cell("Conteúdo duplicado", hm(a.duplicate_min, { compact: true }), `${a.duplicates.length} curso repetido · conta 1x → único ${hm(a.identified_unique_min)}`)}
      ${cell("Ainda não identificado", hm(a.unidentified_min, { compact: true }), `<span class="verify">NÃO IDENTIFICADO</span> não agendado`)}
    </div>
  </section>
  <p class="faint" style="font-size:12.5px;margin:8px 2px 0">Não identificado = declarada − identificada bruta. Se a plataforma somou só conteúdo único, seria ${hm(a.unidentified_if_unique_min)} <span class="verify">VERIFICAR</span>. Nenhuma dessas horas é tratada como curso real.</p>
  <div id="cat-body" class="section"></div>`;

  const body = el.querySelector("#cat-body");
  const draw = () => {
    if (tab === "courses") {
      body.innerHTML = `<div class="panel flush">${d.courses.sort((x, y) => x.study_ord - y.study_ord).map((c, i) => `
        <a class="slot" href="#/course/${encodeURIComponent(c.id)}" style="grid-template-columns:32px 1fr auto">
          <span class="track-num">${i + 1}</span>
          <div style="min-width:0"><div style="font-weight:500">${esc(c.title)}</div>
            <div class="row wrap" style="gap:8px;margin-top:5px"><span class="id-tag">${c.id}</span>
              <span class="faint" style="font-size:12px">print: ${c.appearances.map((p) => "#" + p.position).join(" e ")}</span>
              ${c.appearances.length > 1 ? `<span class="chip accent">${icon("git-branch")} aparece ${c.appearances.length}x · conta 1x</span>` : ""}
              <span class="faint" style="font-size:12px">Trilha:</span><span class="verify">VERIFICAR</span></div></div>
          <div style="text-align:right;min-width:150px"><div class="num" style="font-weight:600">${hm(c.duration_min, { compact: true })} <span class="faint" style="font-weight:400;font-size:12px">vídeo</span></div>
            <div class="faint num" style="font-size:12px">prática est. ${hm(c.practice_est_min, { compact: true })} · ${pct(c.pct)}</div></div></a>`).join("")}</div>
        <p class="faint" style="font-size:12.5px;margin-top:10px">A ordem é uma <b>sugestão do sistema</b> (fundamentos → uso de LLM → programação → ferramentas → agentes), não a ordem das trilhas.</p>`;
    } else if (tab === "tracks") {
      body.innerHTML = `<div class="notice info" style="margin-bottom:16px">${icon("info")}<div>A formação declara <b>${a.tracks_total} trilhas</b>, mas os prints não mostram o nome de nenhuma nem a qual trilha cada card pertence. Para não inventar, todas estão <b>A confirmar</b>. Quando você enviar essa informação, a associação passa a valer e o progresso por trilha aparece.</div></div>
        <div class="panel flush">${d.tracks.map((t) => t.to_confirm
          ? `<div class="slot placeholder" style="grid-template-columns:32px 1fr auto"><span class="track-num">${t.ord}</span><div>${esc(t.title)}</div><span class="verify">A CONFIRMAR</span></div>`
          : `<div class="slot" style="grid-template-columns:32px 1fr auto"><span class="track-num">${t.ord}</span><div><b>${esc(t.title)}</b>${t.name ? " · " + esc(t.name) : ""}<div class="faint" style="font-size:12.5px">${t.courses.map((c) => esc(c.title)).join(" · ")}</div></div><div style="min-width:140px">${bar(t.pct)}</div></div>`).join("")}</div>
        <div class="section-head" style="margin-top:24px"><span class="label">Possível agrupamento pelas posições dos cards (INFERIDO)</span></div>
        <div class="panel">${Object.entries(d.courses.reduce((g, c) => { c.appearances.forEach((p) => (g[p.inferred_group || "?"] ||= []).push({ ...p, title: c.title })); return g; }, {})).sort().map(([g, items]) => `
          <div class="row wrap" style="padding:6px 0;gap:8px"><span class="chip">grupo ${g}</span>${items.sort((x, y) => x.position - y.position).map((i) => `<span class="faint" style="font-size:12.5px">#${i.position} ${esc(i.title)}</span>`).join('<span class="faint">›</span>')}</div>`).join("")}
          <p class="faint" style="font-size:12px;margin:8px 0 0">Deduzido de cards com posições consecutivas e posições repetidas (dois cards #3 não podem estar na mesma trilha). Não é fato: não use como trilha.</p></div>`;
    } else {
      body.innerHTML = `<div class="grid grid-2">
        <section class="panel"><h2 style="margin-bottom:12px">Status dos dados</h2>
          <dl class="kv"><dt>Título, duração, posição</dt><dd>${badge("CONFIRMADO")} nos prints (instrutor truncado como no print)</dd>
          <dt>Trilha de cada curso</dt><dd>${badge("A VERIFICAR")} ${a.courses_without_confirmed_track} de ${a.courses} sem trilha</dd>
          <dt>Nomes das trilhas</dt><dd>${badge("A VERIFICAR")} ${a.tracks_confirmed}/${a.tracks_total} confirmadas</dd>
          <dt>Módulos e aulas</dt><dd>${badge("NÃO IDENTIFICADO")} só o Antigravity informa "17 aulas"; nenhum título de aula</dd>
          <dt>Prática por curso</dt><dd>${badge("ESTIMATIVA DO SISTEMA")} configurável em Ajustes</dd>
          <dt>Ordem de estudo</dt><dd>${badge("INFERIDO")} sugestão do sistema</dd>
          <dt>Unidades no catálogo</dt><dd>${a.course_level_units} cursos inteiros · ${a.lessons_identified} aulas identificadas</dd></dl></section>
        <section class="panel"><h2 style="margin-bottom:12px">Duplicidade e sobreposição</h2>
          ${a.duplicates.map((x) => `<div class="mini-list"><div><span class="id-tag">${x.content_id}</span><span>${esc(x.title)}</span><span class="spacer"></span><span class="faint">cards #${x.positions.join(" e #")} · ${hm(x.duration_min)}</span></div></div>`).join("")}
          <p class="faint" style="font-size:12.5px">Mesmo título, duração, instrutor e nº de inscritos nos dois cards → o mesmo curso. Conta 1x na carga e no progresso. Trilhas: ${badge("A VERIFICAR")}</p>
          ${a.overlaps.map((x) => `<div class="notice info" style="margin-top:10px">${icon("layers")}<div><b>${esc(x.title)}</b><br>${esc(x.note)}</div></div>`).join("")}</section></div>`;
    }
  };
  el.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { tab = b.dataset.tab; el.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); });
  draw();
}
