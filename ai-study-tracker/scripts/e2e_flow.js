// Fluxo real de uso no navegador (Playwright). Uso: AST_DB=... AST_TODAY=2026-11-13 servidor em BASE; node scripts/e2e_flow.js BASE OUT_DIR
const { chromium } = require("playwright");
const [, , BASE = "http://localhost:8768/", OUT = "."] = process.argv;
const assert = (c, m) => { if (!c) { console.error("FALHOU:", m); process.exitCode = 1; } else console.log("ok:", m); };
const num = async (pg, sel) => +(await pg.textContent(sel)).replace(/\D/g, "");
(async () => {
  const b = await chromium.launch();
  let ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  let pg = await ctx.newPage();
  const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
  await pg.goto(BASE, { waitUntil: "networkidle" });
  // 1) vê o estudo de hoje
  const first = (await pg.textContent(".hs-title")).trim();
  assert(first.length > 3, `Estudar agora mostra: «${first}»`);
  const pct0 = await pg.textContent(".big-num");
  const xp0 = await pg.textContent("a.chip.accent");
  const done0 = (await (await fetch(BASE + "api/dashboard")).json());
  await pg.screenshot({ path: `${OUT}/e2e-1-hoje.png` });
  // 2) inicia sessão
  await pg.click("#hs-start"); await pg.waitForSelector(".session-card");
  assert(await pg.isVisible("#se-done"), "tela de sessão aberta com Concluir");
  const startBtn = await pg.$("#se-start"); if (startBtn) { await startBtn.click(); await pg.waitForTimeout(1200); await pg.screenshot({ path: `${OUT}/e2e-2-sessao.png` }); await startBtn.click(); }
  // 3) conclui a aula
  await pg.click("#se-done"); await pg.waitForSelector(".done-badge");
  assert((await pg.textContent(".session-title")).toLowerCase().includes("concluída"), "sessão mostra «Aula concluída»");
  const nextTitle = await pg.textContent(".next-card b");
  assert(nextTitle && nextTitle.trim() !== first, `próxima atividade carregada: «${nextTitle.trim()}»`);
  await pg.screenshot({ path: `${OUT}/e2e-3-concluida.png` });
  await pg.click("#se-close"); await pg.waitForTimeout(800);
  // 4) progresso, XP, pendência
  const d1 = await pg.evaluate(async () => (await fetch("/api/dashboard")).json());
  assert(d1.overall > done0.overall, `progresso aumentou (${(done0.overall * 100).toFixed(2)}% → ${(d1.overall * 100).toFixed(2)}%)`);
  assert(d1.xp > done0.xp, `XP aumentou (${done0.xp} → ${d1.xp})`);
  assert(d1.study_now.title !== first, "a aula concluída deixou de ser a pendente");
  assert(d1.streak.current >= 1, "sequência atualizada");
  const rv = await pg.evaluate(async () => (await fetch("/api/reviews")).json());
  assert(rv.reviews.some((r) => r.interval === 1 && r.status === "scheduled"), "revisão futura (D+1) criada");
  assert((await pg.textContent(".hs-title")).includes(d1.study_now.title.trim()), "dashboard atualizado com a próxima aula");
  await pg.screenshot({ path: `${OUT}/e2e-4-depois.png` });
  // 5) fecha e reabre: dados persistem
  await ctx.close(); ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); pg = await ctx.newPage();
  await pg.goto(BASE, { waitUntil: "networkidle" });
  const d2 = await pg.evaluate(async () => (await fetch("/api/dashboard")).json());
  assert(d2.lessons.done === d1.lessons.done && d2.xp === d1.xp, "após fechar e reabrir, progresso e XP continuam salvos");
  assert((await pg.textContent(".hs-title")).includes(d1.study_now.title.trim()), "mesma próxima aula após reabrir");
  // 6) mobile
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mp = await m.newPage(); await mp.goto(BASE, { waitUntil: "networkidle" });
  assert(await mp.isVisible(".tabbar"), "mobile: navegação inferior visível");
  assert(!(await mp.isVisible(".sidebar")), "mobile: sidebar oculta");
  const sw = await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  assert(sw, "mobile: sem rolagem horizontal");
  await mp.screenshot({ path: `${OUT}/e2e-5-mobile.png` });
  assert(errs.length === 0, "nenhum erro de JavaScript" + (errs.length ? ": " + errs.join("|") : ""));
  await b.close();
})();
