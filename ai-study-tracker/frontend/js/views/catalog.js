import { api, bar, esc, hm, hours, icon, pct, skeleton, verify } from "../core.js";

let tab = "tracks";

export default async function catalog(el) {
  el.innerHTML = skeleton(500);
  const d = await api("/catalog");
  const a = d.analysis;
  const focusTrack = sessionStorage.getItem("ast:track"); sessionStorage.removeItem("ast:track");
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">${esc(a.name || "Formação")}</p><h1>Catálogo da formação</h1></div>
    <div class="seg" role="group" aria-label="Visualização"><button data-tab="tracks" aria-pressed="${tab === "tracks"}">Trilhas</button><button data-tab="sequence" aria-pressed="${tab === "sequence"}">Sequência de estudo</button><button data-tab="analysis" aria-pressed="${tab === "analysis"}">Análise</button></div></div>

  <section class="panel flush" aria-label="Carga bruta x única">
    <div class="compare">
      <div><div class="stat-label">Carga bruta (declarada)</div><div class="stat-value num">${hm(a.gross_min, { compact: true })}</div><div class="faint" style="font-size:12.5px">soma de todas as aparições nas trilhas</div></div>
      <div><div class="stat-label">Conteúdo único</div><div class="stat-value num">${hm(a.unique_min, { compact: true })}</div><div class="faint" style="font-size:12.5px">${a.duplicates.length} conteúdo(s) repetido(s) contado(s) uma vez · −${hm(a.duplicates.reduce((s, x) => s + x.saved_min, 0))}</div></div>
      <div><div class="stat-label">Visível nos prints</div><div class="stat-value num">${hm(a.visible_unique_min, { compact: true })} <small>únicos</small></div><div class="faint" style="font-size:12.5px">${a.courses_unique} cursos · reserva ${verify(true)} ${hm(a.reserve_min, { compact: true })}</div></div>
    </div>
  </section>
  ${a.status !== "final" ? `<div class="notice section" style="margin-top:16px">${icon("triangle-alert")}<div>${esc(a.note || "")}<br><span class="faint">Quando você mandar os prints que faltam (nomes das trilhas, cursos #1/#2, trilhas 7–8 e listas de aulas), basta atualizar <span class="mono">data/catalog.json</span> ou importar em Ajustes → Catálogo.</span></div></div>` : ""}
  <div id="cat-body" class="section"></div>`;

  const body = el.querySelector("#cat-body");
  const draw = () => {
    if (tab === "tracks") {
      body.innerHTML = d.tracks.map((t) => `
      <section class="section" id="trk-${t.id}" style="margin-top:20px">
        <div class="section-head"><div class="row"><span class="track-num">${t.ord}</span><h2>${esc(t.title)} ${verify(t.verify, "NOME")}</h2><span class="faint">· ${esc(t.theme || "")}</span></div>
          <div class="row" style="min-width:180px">${bar(t.pct)}<span class="num" style="font-weight:600">${pct(t.pct)}</span></div></div>
        <div class="panel flush">${t.slots.map((s) => s.placeholder
          ? `<div class="slot placeholder"><span class="track-num">${s.position}</span><div>Curso na posição #${s.position} não visível nos prints ${verify(true)}</div><span class="faint">—</span></div>`
          : `<a class="slot" href="#/course/${encodeURIComponent(s.content_id)}"><span class="track-num">${s.position}</span>
              <div style="min-width:0"><div style="font-weight:500">${esc(s.title)} ${s.reserve ? verify(true, "NÃO MAPEADO") : ""}</div>
                <div class="row wrap" style="gap:8px;margin-top:4px"><span class="id-tag">${s.content_id}</span>${s.shared_with.length ? `<span class="chip accent">${icon("git-branch")} também na ${s.shared_with.map((x) => x.replace("T", "Trilha ")).join(", ")} · contado 1x</span>` : ""}</div></div>
              <div style="text-align:right;min-width:90px"><div class="num" style="font-weight:600">${hm(s.duration_min, { compact: true })}</div><div class="faint num" style="font-size:12px">${pct(s.pct)}</div></div></a>`).join("")}
        </div>
        <div class="row wrap faint" style="font-size:12.5px;margin-top:8px;gap:14px"><span>${hours(t.video_total)} de vídeo</span><span>${t.lessons_done}/${t.lessons} aulas/blocos</span>${t.projects.length ? `<span>Lab: ${t.projects.map((p) => p.id).join(", ")}</span>` : ""}</div>
      </section>`).join("");
      if (focusTrack) document.getElementById(`trk-${focusTrack}`)?.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "sequence") {
      body.innerHTML = `<div class="notice info" style="margin-bottom:16px">${icon("info")}<div>A ordem de estudo não é a ordem das trilhas: cada curso é estudado <b>uma única vez</b>, numa sequência pedagógica (fundamentos → uso profissional de LLM → programação com IA → ferramentas → agentes → aplicações). Cursos repetidos entre trilhas aparecem só uma vez aqui.</div></div>
      <div class="panel flush">${d.sequence.map((c, i) => `<a class="slot" href="#/course/${encodeURIComponent(c.id)}"><span class="track-num">${i + 1}</span>
        <div><div style="font-weight:500">${esc(c.title)} ${c.reserve ? verify(true, "NÃO MAPEADO") : ""}</div><div style="margin-top:6px;max-width:320px">${bar(c.pct, "", "thin")}</div></div>
        <div style="text-align:right"><span class="id-tag">${c.id}</span><div class="num faint" style="font-size:12.5px;margin-top:4px">${hm(c.duration_min, { compact: true })}</div></div></a>`).join("")}</div>`;
    } else {
      body.innerHTML = `<div class="grid grid-2">
        <section class="panel"><h2 style="margin-bottom:12px">Contagem</h2>
          <dl class="kv"><dt>Trilhas</dt><dd>${a.tracks} de ${a.declared_tracks ?? "?"} declaradas (2 sem nenhum curso visível)</dd>
          <dt>Cursos únicos visíveis</dt><dd>${a.courses_unique}</dd><dt>Aparições nas trilhas</dt><dd>${a.course_appearances}</dd>
          <dt>Posições não visíveis</dt><dd>${a.placeholders} ${verify(true)}</dd>
          <dt>Aulas mapeadas</dt><dd>${a.lessons_mapped} ${a.lessons_mapped === 0 ? verify(true, "LISTAS DE AULAS") : ""}</dd>
          <dt>Blocos de estudo</dt><dd>${a.study_blocks} (cursos sem lista de aulas são divididos em blocos de ~40 min — a duração total é real)</dd>
          <dt>Duração declarada</dt><dd class="num">${hm(a.declared_min)}</dd></dl></section>
        <section class="panel"><h2 style="margin-bottom:12px">Duplicidades e sobreposições</h2>
          ${a.duplicates.map((x) => `<div class="mini-list"><div><span class="id-tag">${x.content_id}</span><span>${esc(x.title)}</span><span class="spacer"></span><span class="faint">${x.tracks.join(" + ")} · ${hm(x.duration_min)}</span></div></div>`).join("")}
          <p class="faint" style="font-size:12.5px">Mesmo ID em várias trilhas: conta 1x no progresso e na carga horária, mas o progresso aparece em todas as trilhas.</p>
          ${a.overlaps.map((x) => `<div class="notice info" style="margin-top:10px">${icon("layers")}<div><b>${esc(x.title)}</b><br>${esc(x.note)}</div></div>`).join("")}
          ${a.intro_courses.length ? `<p style="margin-top:14px"><b>Introdutórios:</b> ${a.intro_courses.map((x) => esc(x.title)).join(", ")}</p>` : ""}
        </section></div>`;
    }
  };
  el.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { tab = b.dataset.tab; el.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); });
  draw();
}
