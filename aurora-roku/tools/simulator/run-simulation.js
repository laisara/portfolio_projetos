#!/usr/bin/env node
'use strict';
/*
 * Executa o Aurora TV no simulador brs-engine + brs-scenegraph (terceiros)
 * dentro de um Chromium headless (Playwright), envia teclas do controle
 * remoto simulado e salva capturas em tools/simulator/output/.
 *
 * Limites: o brs-engine é um SIMULADOR, não o Roku OS. Um roteiro que
 * passa aqui não comprova o comportamento no Roku Express 3960BR.
 * Nada é enviado a nenhum aparelho; o servidor escuta só em 127.0.0.1.
 *
 * Uso: node tools/simulator/run-simulation.js [--smoke]
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');
const PUBLIC = path.join(__dirname, 'public');
const OUTPUT = path.join(__dirname, 'output');
const SMOKE = process.argv.includes('--smoke');

function requireFrom(name) {
  try { return require(name); } catch (e) { /* tenta a instalação global */ }
  return require(path.join(process.env.NODE_PATH || '/opt/node22/lib/node_modules', name));
}

function prepare() {
  execFileSync('python3', [path.join(ROOT, 'tools', 'package.py')], { stdio: 'inherit' });
  fs.rmSync(PUBLIC, { recursive: true, force: true });
  fs.mkdirSync(path.join(PUBLIC, 'lib'), { recursive: true });
  fs.mkdirSync(path.join(PUBLIC, 'assets'), { recursive: true });
  const nm = path.join(ROOT, 'node_modules');
  const copies = [
    [path.join(__dirname, 'index.html'), 'index.html'],
    [path.join(nm, 'brs-engine/lib/brs.api.js'), 'lib/brs.api.js'],
    [path.join(nm, 'brs-engine/lib/brs.worker.js'), 'lib/brs.worker.js'],
    [path.join(nm, 'brs-scenegraph/lib/brs-sg.js'), 'lib/brs-sg.js'],
    // Apps SceneGraph usam o common.zip da extensão (traz as fontes padrão).
    [path.join(nm, 'brs-scenegraph/assets/common.zip'), 'assets/common.zip'],
    [path.join(ROOT, 'out/aurora-tv.zip'), 'aurora-tv.zip'],
  ];
  for (const [from, to] of copies) {
    if (!fs.existsSync(from)) throw new Error(`Arquivo ausente: ${from} (execute "npm install")`);
    fs.copyFileSync(from, path.join(PUBLIC, to));
  }
}

// COOP/COEP são exigidos pelo brs-engine (SharedArrayBuffer).
function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.zip': 'application/zip' };
  const server = http.createServer((req, res) => {
    const file = path.join(PUBLIC, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file)) {
      if (process.env.SIM_DEBUG) console.log('404 ' + req.url);
      res.writeHead(404).end();
      return;
    }
    if (process.env.SIM_DEBUG) console.log('200 ' + req.url);
    // Corpo inteiro com Content-Length: com stream sem tamanho, o
    // common.zip do simulador às vezes chegava incompleto.
    const body = fs.readFileSync(file);
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    });
    res.end(body);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function main() {
  prepare();
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT, { recursive: true });
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/`;
  const { chromium } = requireFrom('playwright');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const consoleLines = [];
  const attach = (p) => {
    p.on('console', (m) => consoleLines.push(m.text()));
    p.on('pageerror', (e) => consoleLines.push('PAGEERROR ' + e.message));
  };
  attach(page);

  await page.goto(url);
  await page.waitForFunction(() => window.simReady === true, null, { timeout: 60000 });
  const settle = (ms = 1200) => page.waitForTimeout(ms);
  const current = () => page;
  const shot = async (name) => {
    await settle();
    await page.locator('#display').screenshot({ path: path.join(OUTPUT, name + '.png') });
    console.log('captura: ' + name + '.png');
  };
  const press = async (...keys) => {
    for (const k of keys) {
      await page.evaluate((key) => brs.sendKeyPress(key), k);
      await page.waitForTimeout(450);
    }
  };

  // Verificações: procuram o padrão nas linhas de console desde a última
  // verificação (rastros AURORA_* impressos pelo app).
  const results = [];
  let cursor = 0;
  const logs = { since: () => consoleLines.slice(cursor) };
  const check = async (pattern, label, predicate) => {
    let ok = false;
    let next = consoleLines.length;
    for (let i = 0; i < 15 && !ok; i++) {
      if (predicate) {
        ok = predicate();
      } else {
        const idx = logs.since().findIndex((l) => pattern.test(l));
        ok = idx >= 0;
        if (ok) next = cursor + idx + 1; // a próxima verificação começa após a linha encontrada
      }
      if (!ok) await page.waitForTimeout(200);
    }
    results.push({ label, ok });
    console.log((ok ? 'ok     - ' : 'FALHOU - ') + label);
    cursor = ok && !predicate ? next : consoleLines.length;
  };
  const relaunch = async () => {
    // Relança o app na MESMA instância do simulador (o registro do Roku
    // simulado continua lá), como o aparelho faz ao reabrir um canal.
    await page.evaluate(async () => {
      window.simReady = false;
      const zip = await (await fetch('aurora-tv.zip')).arrayBuffer();
      brs.execute('aurora-tv.zip', zip, { clearDisplayOnExit: false });
    });
    await page.waitForFunction(() => window.simReady === true, null, { timeout: 60000 });
    await settle(5000);
    cursor = consoleLines.length;
  };


  await settle(5000);
  await shot('01-inicio');
  await check(/AURORA_NAV tab=home zone=content|Entering 'Aurora TV'/, 'App inicia na tela Início');
  if (!SMOKE) {
    const scenario = require('./scenario.js');
    await scenario({ press, shot, settle, page: current, logs, check, relaunch });
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nRoteiro: ${results.length - failed} de ${results.length} verificações aprovadas.`);

  fs.writeFileSync(path.join(OUTPUT, 'console.log'), consoleLines.join('\n'));
  const problems = consoleLines.filter((l) => /BRIGHTSCRIPT: ERROR|Runtime Error|CRASH|PAGEERROR|not found|Syntax Error|Type Mismatch|Invalid/i.test(l));
  await browser.close();
  server.close();
  console.log(`\n${consoleLines.length} linhas de console; ${problems.length} com indício de erro (ver output/console.log).`);
  problems.slice(0, 40).forEach((p) => console.log('  ! ' + p.slice(0, 300)));
  process.exit(problems.length || failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
