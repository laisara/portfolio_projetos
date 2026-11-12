// Uso: NODE_PATH=$(npm root -g) node scripts/audit_perf.js  (ajuste a URL; app rodando)
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const pg = await ctx.newPage();
  const cdp = await ctx.newCDPSession(pg);
  await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  let bytes = 0, reqs = 0, external = 0;
  pg.on("response", async (r) => { reqs++; if (!r.url().startsWith("http://localhost")) external++; try { bytes += (await r.body()).length; } catch {} });
  const t0 = Date.now();
  await pg.goto("http://localhost:8766/#/", { waitUntil: "networkidle" });
  const nav = await pg.evaluate(() => { const p = performance.getEntriesByType("paint"); const n = performance.getEntriesByType("navigation")[0]; return { fcp: Math.round(p.find((x) => x.name === "first-contentful-paint")?.startTime), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) }; });
  const heap = await pg.evaluate(() => Math.round(performance.memory.usedJSHeapSize / 1048576));
  console.log(JSON.stringify({ ...nav, requests: reqs, externalRequests: external, transferKB: Math.round(bytes / 1024), jsHeapMB: heap, networkidleMs: Date.now() - t0, note: "4x CPU throttle + 'Slow 4G'" }));
  await b.close();
})();
