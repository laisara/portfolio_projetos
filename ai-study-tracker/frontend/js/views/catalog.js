import { api, bar, esc, hm, icon, pct } from "../core.js";
import { skeleton } from "../core.js";

let tab = "tracks";

export default async function catalog(el) {
  el.innerHTML = skeleton(500);
  const d = await api("/catalog");
  const a = d.analysis;
  const focusTrack = sessionStorage.getItem("ast:track"); sessionStorage.removeItem("ast:track");
  const cell = (label, val, note, extra = "") => `<div><div class="stat-label">${label}</div><div class="stat-value num" ${extra}>${val}</div><div class="faint" style="font-size:12.5px">${note}</div></div>`;
  el.innerHTML = `
  <div class="page-head"><div><p class="eyebrow">${esc(a.name || "Formação")}</p><h1>Formação</h1></div>
    <div class="seg" role="group" aria-label="Visualização"><button data-tab="tracks" aria-pressed="${tab === "tracks"}">Trilhas</button><button data-tab="courses" aria-pressed="${tab === "courses"}">Cursos únicos</button><button data-tab="audit" aria-pressed="${tab === "audit"}">Carga</button></div></div>

  <section class="panel flush" aria-label="Carga da formação">
    <div class="compare" style="grid-template-columns:repeat(4,1fr)">
      ${cell("Carga bruta (8 trilhas)", hm(a.gross_min, { compact: true }), `${a.appearances} aparições de cursos`)}
      ${cell("Conteúdo duplicado", hm(a.duplicate_min, { compact: true }), `${a.duplicates.length} cursos repetidos entre trilhas`)}
      ${cell("Conteúdo único a estudar", hm(a.unique_min, { compact: true }), `${a.courses} cursos · ${a.lessons} aulas`, 'style="color:var(--green-hover)"')}
      ${cell("Declarado pela plataforma", hm(a.declared_min, { compact: true }), `diferença ${a.diff_vs_declared_min >= 0 ? "+" : ""}${hm(Math.abs(a.diff_vs_declared_min))} (só informativo)`)}
    </div>
  </section>
  <div id="cat-body" class="section"></div>`;

  const body = el.querySelector("#cat-body");
  const course = (c, idx) => `<a class="slot" href="#/course/${encodeURIComponent(c.id)}" style="grid-template-columns:32px 1fr auto">
      <span class="track-num">${idx}</span>
      <div style="min-width:0"><div style="font-weight:500">${esc(c.title)}${c.complete ? ` <span style="color:var(--good)">${icon("circle-check", "icon icon-sm")}</span>` : ""}</div>
        <div class="row wrap" style="gap:8px;margin-top:5px"><span class="id-tag">${c.id}</span>${c.type === "projeto" ? '<span class="chip warn">projeto</span>' : ""}
          ${c.shared_with?.length ? `<span class="chip accent" title="Concluir aqui conclui nas outras trilhas">${icon("git-branch")} também em ${c.shared_with.map((x) => x.replace("T", "Trilha ")).join(", ")}</span>` : ""}
          ${c.tracks?.length > 1 ? `<span class="chip accent">${icon("git-branch")} em ${c.tracks.length} trilhas</span>` : ""}</div></div>
      <div style="text-align:right;min-width:150px"><div class="num" style="font-weight:600">${hm(c.duration_min, { compact: true })}</div>
        <div class="faint num" style="font-size:12px">${c.lessons_done}/${c.lessons} aulas · ${pct(c.pct)}</div></div></a>`;
  const draw = () => {
    if (tab === "tracks") {
      body.innerHTML = ["Produtividade pessoal com IA", "Criando sistemas profissionais de inteligência artificial"].map((g) => `
        <div class="section-head" style="margin-top:8px"><span class="label">${esc(g)}</span></div>
        ${d.tracks.filter((t) => t.group_name === g).map((t) => `
        <section id="trk-${t.id}" style="margin-bottom:22px">
          <div class="section-head"><div class="row"><span class="track-num">${t.ord}</span><h2>${esc(t.title)}</h2></div>
            <div class="row" style="min-width:230px">${bar(t.pct, "", "", t.title)}<span class="num" style="font-weight:600">${pct(t.pct)}</span></div></div>
          <div class="panel flush">${t.courses.map((c, i) => course(c, i + 1)).join("")}</div>
          <div class="row wrap faint" style="font-size:12.5px;margin-top:8px;gap:14px"><span>${hm(t.video_total)} de aulas</span><span>${t.courses_done}/${t.courses.length} cursos</span><span>${t.lessons_done}/${t.lessons} aulas</span>
            ${t.header_min ? `<span title="Duração mostrada no cabeçalho da trilha no site">cabeçalho do site: ${hm(t.header_min)}</span>` : ""}</div>
        </section>`).join("")}`).join("");
      if (d.optional?.length) body.insertAdjacentHTML("beforeend", `<section id="optionals" style="margin-top:12px">
        <div class="section-head"><span class="label">Opcionais · fora do progresso, das trilhas e do cronograma</span></div>
        <div class="panel flush">${d.optional.map((c, i) => `<a class="slot" href="#/course/${encodeURIComponent(c.id)}" style="grid-template-columns:32px 1fr auto">
          <span class="track-num" style="border-style:dashed">${icon("star", "icon icon-sm")}</span>
          <div style="min-width:0"><div style="font-weight:500">${esc(c.title)}${c.complete ? ` <span style="color:var(--good)">${icon("circle-check", "icon icon-sm")}</span>` : ""}</div>
            <div class="row wrap" style="gap:8px;margin-top:5px"><span class="id-tag">${c.id}</span><span class="chip">opcional</span><span class="faint" style="font-size:12px">eletivo · Webapps</span></div></div>
          <div style="text-align:right;min-width:150px"><div class="num" style="font-weight:600">${hm(c.duration_min, { compact: true })}</div>
            <div class="faint num" style="font-size:12px">${c.lessons_done}/${c.lessons} aulas · ${pct(c.pct)}</div></div></a>`).join("")}</div>
        <p class="faint" style="font-size:12.5px;margin:8px 0 0">Estude quando quiser: o progresso do curso é guardado, mas não conta no progresso geral nem entra no cronograma.</p></section>`);
      if (focusTrack) document.getElementById(`trk-${focusTrack}`)?.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "courses") {
      body.innerHTML = `<div class="notice info" style="margin-bottom:16px">${icon("info")}<div>Cada curso existe <b>uma vez</b>, na ordem da plataforma (trilhas na ordem, cursos na ordem de cada trilha; um curso repetido aparece na primeira trilha em que surge). Concluir um curso conclui em todas as trilhas.</div></div>
        <div class="panel flush">${d.courses.sort((x, y) => x.study_ord - y.study_ord).map((c, i) => course(c, i + 1)).join("")}</div>`;
    } else {
      body.innerHTML = `<div class="grid grid-2">
        <section class="panel"><h2 style="margin-bottom:12px">Como a carga é calculada</h2>
          <dl class="kv" style="grid-template-columns:170px 1fr"><dt>Duração de um curso</dt><dd>soma das durações das aulas (player)</dd>
          <dt>Aula sem duração</dt><dd><span class="dash">-</span> conta 0 min (${a.lessons_without_duration} aulas: quizzes, testes e guias)</dd>
          <dt>Aviso "em breve"</dt><dd>${a.placeholders} item não é aula e não bloqueia a conclusão</dd>
          <dt>Curso repetido</dt><dd>1 cadastro, progresso único, vale em todas as trilhas</dd>
          <dt>Opcional</dt><dd>${(a.optional || []).map((x) => `${esc(x.title)} (${x.lessons} aulas, ${hm(x.duration_min)}): fora dos totais`).join("<br>") || "—"}</dd>
          <dt>Fora do programa</dt><dd>${(a.excluded || []).map((x) => esc(x)).join("<br>")}</dd></dl></section>
        <section class="panel"><h2 style="margin-bottom:12px">Cursos repetidos entre trilhas</h2>
          <div class="mini-list">${a.duplicates.map((x) => `<div><span class="id-tag">${x.content_id}</span><span>${esc(x.title)}</span><span class="spacer"></span><span class="faint">${x.tracks.join(" · ")} · ${hm(x.duration_min)}</span></div>`).join("")}</div>
          <p class="faint" style="font-size:12.5px;margin-top:10px">Contado uma vez na carga única (${hm(a.unique_min)}). A carga bruta (${hm(a.gross_min)}) soma cada aparição.</p></section>
        <section class="panel" style="grid-column:1/-1"><h2 style="margin-bottom:12px">Soma das aulas × cabeçalho de cada trilha</h2>
          <table class="tbl"><thead><tr><th>Trilha</th><th class="r">Soma das aulas</th><th class="r">Cabeçalho do site</th><th class="r">Diferença</th></tr></thead><tbody>
          ${a.tracks_check.map((t) => `<tr><td>${esc(t.title)}</td><td class="r num">${hm(t.sum_min)}</td><td class="r num">${t.header_min ? hm(t.header_min) : "—"}</td><td class="r num faint">${t.header_min ? (t.sum_min - t.header_min >= 0 ? "+" : "−") + hm(Math.abs(t.sum_min - t.header_min)) : ""}</td></tr>`).join("")}</tbody></table></section></div>`;
    }
  };
  el.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { tab = b.dataset.tab; el.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); });
  draw();
}
