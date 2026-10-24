#!/usr/bin/env node
'use strict';
/*
 * Verifica a documentação contra o projeto real:
 *   1. todo caminho de arquivo citado entre crases nos .md existe;
 *   2. todo link relativo [texto](arquivo.md) aponta para um arquivo existente;
 *   3. os números que a documentação afirma (testes de lógica, abas, itens do
 *      catálogo) coincidem com o código e com a execução real dos testes;
 *   4. os documentos obrigatórios existem e não estão vazios.
 *
 * Só usa a biblioteca padrão do Node. Não valida a verdade técnica do texto:
 * só que o que ele aponta existe.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DOCS = ['README.md', 'SOURCES.md', 'PLATFORM_COMPATIBILITY.md', 'DESIGN_SYSTEM.md', 'TEST_PLAN.md', 'FINAL_REPORT.md', 'tests/manual-test-checklist.md'];
const errors = [];
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

for (const doc of DOCS) {
  const full = path.join(ROOT, doc);
  if (!fs.existsSync(full) || fs.statSync(full).size < 200) errors.push(`Documento ausente ou vazio: ${doc}`);
}

// Caminhos gerados (existem só depois de executar as ferramentas) ou fora do projeto.
const GENERATED = [/^out\//, /^dist\//, /^node_modules\//, /^tools\/simulator\/(output|public)\//, /^images\/posters\/<id>/, /^images\/backgrounds\/<id>/, /^images\/ui\/<tema>/, /^<|^\.\.\./, /^\//];
const looksLikePath = (t) => /^[\w./<>-]+$/.test(t) && (t.includes('/') || /\.(brs|xml|md|js|py|json|jpg|png|html)$/.test(t) || t === 'manifest');

const checked = new Set();
for (const doc of DOCS) {
  if (!fs.existsSync(path.join(ROOT, doc))) continue;
  const text = read(doc);
  const base = path.dirname(doc);
  // SOURCES.md cita caminhos de repositórios externos (samples da Roku etc.):
  // para ele só os links relativos são conferidos.
  const tokens = doc === 'SOURCES.md' ? [] : [...text.matchAll(/`([^`\n]+)`/g)];
  for (const m of tokens) {
    let token = m[1].trim().replace(/[.,;:]+$/, '');
    token = token.replace(/\.xml\/\.brs$/, '.xml'); // "Nome.xml/.brs" nas tabelas
    if (!looksLikePath(token) || GENERATED.some((re) => re.test(token))) continue;
    if (token.includes('*') || token.includes('<')) continue;
    // Resolve a partir da raiz do projeto, depois da pasta do documento.
    const candidates = [token, path.join(base, token)];
    // Nomes sem pasta (ex.: DemoContent.brs) são procurados em todo o projeto.
    if (!token.includes('/')) candidates.push(...findByName(token));
    const ok = candidates.some((c) => fs.existsSync(path.join(ROOT, c)));
    checked.add(token);
    if (!ok) errors.push(`${doc}: caminho citado não existe: ${token}`);
  }
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
    const link = m[1];
    if (/^(https?:|mailto:)/.test(link)) continue;
    if (!fs.existsSync(path.join(ROOT, base, link))) errors.push(`${doc}: link relativo quebrado: ${link}`);
  }
}

function findByName(name) {
  const found = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', 'out', 'dist', 'output', 'public', '.git'].includes(e.name)) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (e.name === name) found.push(rel);
    }
  })('.');
  return found;
}

// Números afirmados na documentação × código e execução real.
const { spawnSync } = require('node:child_process');
const demo = read('source/shared/DemoContent.brs');
const titles = (demo.match(/^\s+[ms]\d\d: \{ title:/gm) || []).length;
const apps = (demo.match(/^\s+a\d\d: \{ title:/gm) || []).length;
const tabs = (read('source/shared/NavigationLogic.brs').match(/\{ id: "[a-z]+", label:/g) || []).length;
if (titles !== 20 || apps !== 8) errors.push(`Catálogo esperado: 20 títulos e 8 aplicativos; encontrado ${titles} e ${apps}`);
if (tabs !== 7) errors.push(`Esperadas 7 abas; encontradas ${tabs}`);

// Testes de lógica: executa e compara com o que os documentos afirmam.
const run = spawnSync(process.execPath, [path.join(__dirname, 'run-unit-tests.js')], { cwd: ROOT, encoding: 'utf8' });
const passed = Number(((run.stdout || '').match(/RESULTADO: (\d+) aprovados/) || [])[1]);
if (!passed || run.status !== 0) errors.push('Não foi possível executar os testes de lógica para conferir a documentação');
for (const doc of DOCS) {
  if (!fs.existsSync(path.join(ROOT, doc))) continue;
  for (const m of read(doc).matchAll(/(\d+) testes de lógica/g)) {
    if (passed && Number(m[1]) !== passed) errors.push(`${doc}: afirma "${m[0]}", mas a execução teve ${passed}`);
  }
}

console.log(`info  caminhos citados e verificados: ${checked.size}`);
console.log(`info  catálogo: ${titles} títulos + ${apps} aplicativos · abas: ${tabs} · testes de lógica executados: ${passed}`);
if (errors.length) {
  for (const e of errors) console.log('ERRO  ' + e);
  console.log(`\n${errors.length} erro(s).`);
  process.exit(1);
}
console.log('\nOK: documentação coerente com o projeto.');
