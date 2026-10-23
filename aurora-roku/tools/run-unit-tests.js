#!/usr/bin/env node
'use strict';
/*
 * Executa tests/unit/LogicTests.brs com o interpretador brs-cli (pacote
 * brs-node, de terceiros) junto com source/shared/*.brs.
 * Valida só a lógica pura (navegação, favoritos, estado, temas, dados);
 * não executa SceneGraph e não prova o comportamento no Roku.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const cli = path.join(ROOT, 'node_modules', '.bin', 'brs-cli');
if (!fs.existsSync(cli)) {
  console.error('brs-cli não encontrado: execute "npm install" em aurora-roku/.');
  process.exit(2);
}
const shared = fs.readdirSync(path.join(ROOT, 'source/shared')).filter((f) => f.endsWith('.brs')).map((f) => path.join('source/shared', f));
const run = spawnSync(cli, [...shared, 'tests/unit/LogicTests.brs'], { cwd: ROOT, encoding: 'utf8' });
const out = (run.stdout || '') + (run.stderr || '');
const lines = out.split('\n').filter((l) => /^(ok|FAIL|RESULTADO)/.test(l));
console.log(lines.join('\n'));
const summary = lines.find((l) => l.startsWith('RESULTADO'));
if (!summary || /FAIL/.test(out) || /\b[1-9]\d* reprovados/.test(summary)) {
  console.error('\nTestes de lógica falharam ou não rodaram.\n' + out.slice(-2000));
  process.exit(1);
}
