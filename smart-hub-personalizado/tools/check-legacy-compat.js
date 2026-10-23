#!/usr/bin/env node
'use strict';
/*
 * Verificação estática do código destinado à plataforma legada.
 *
 * 1. JavaScript: todo arquivo em prototype/scripts e platform/adapters
 *    (e os scripts embutidos nas páginas HTML) deve ser analisável
 *    como ECMAScript 5 (acorn, ecmaVersion 5) e não pode usar APIs
 *    modernas listadas em FORBIDDEN_IDENTIFIERS.
 * 2. CSS: os estilos não podem usar recursos listados em FORBIDDEN_CSS.
 *
 * Passar nesta verificação NÃO prova que o código roda na TV: apenas
 * reduz riscos conhecidos. O nível real de JS/CSS da plataforma ainda
 * precisa ser confirmado (docs/PLATFORM_COMPATIBILITY.md).
 */
const fs = require('node:fs');
const path = require('node:path');

let acorn;
try {
  acorn = require('acorn');
} catch (e) {
  console.error('Dependência ausente: execute "npm install" na pasta smart-hub-personalizado.');
  process.exit(2);
}

const ROOT = path.join(__dirname, '..', 'prototype');
// Pastas de JavaScript destinadas à TV (o rascunho do adaptador também).
const SCRIPT_DIRS = [path.join(ROOT, 'scripts'), path.join(__dirname, '..', 'platform', 'adapters')];

const FORBIDDEN_IDENTIFIERS = [
  'Promise', 'fetch', 'Symbol', 'Map', 'Set', 'WeakMap', 'Proxy', 'Reflect',
  'Intl', 'classList', 'dataset', 'requestAnimationFrame', 'localeCompare',
  'toLocaleString', 'toLocaleDateString', 'toLocaleTimeString', 'includes',
  'startsWith', 'endsWith', 'padStart', 'assign', 'find', 'findIndex'
];

const FORBIDDEN_CSS = [
  { pattern: /var\(--/, name: 'variáveis CSS' },
  { pattern: /display\s*:\s*(-webkit-)?(inline-)?flex/, name: 'flexbox' },
  { pattern: /display\s*:\s*(inline-)?grid/, name: 'CSS grid' },
  { pattern: /calc\(/, name: 'calc()' },
  { pattern: /backdrop-filter|filter\s*:/, name: 'filtros' },
  { pattern: /@supports/, name: '@supports' }
];

function listFiles(dir, ext) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(listFiles(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const problems = [];

for (const file of SCRIPT_DIRS.flatMap((dir) => listFiles(dir, '.js'))) {
  const rel = path.relative(path.join(ROOT, '..'), file);
  const source = fs.readFileSync(file, 'utf8');
  try {
    acorn.parse(source, { ecmaVersion: 5, sourceType: 'script' });
  } catch (err) {
    problems.push(`${rel}: sintaxe fora do ES5 — ${err.message}`);
    continue;
  }
  for (const token of acorn.tokenizer(source, { ecmaVersion: 5, locations: true })) {
    if (token.type.label === 'name' && FORBIDDEN_IDENTIFIERS.indexOf(token.value) >= 0) {
      problems.push(`${rel}:${token.loc.start.line}: API não garantida na plataforma legada: ${token.value}`);
    }
  }
}

// Scripts embutidos nas páginas HTML também são verificados.
for (const page of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const inline = /<script>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = inline.exec(html)) !== null) {
    try {
      acorn.parse(match[1], { ecmaVersion: 5, sourceType: 'script' });
    } catch (err) {
      problems.push(`${page}:${lineOf(html, match.index)}: script embutido fora do ES5 — ${err.message}`);
    }
  }
}

for (const file of listFiles(path.join(ROOT, 'styles'), '.css')) {
  const rel = path.relative(ROOT, file);
  const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  for (const rule of FORBIDDEN_CSS) {
    const m = rule.pattern.exec(css);
    if (m) problems.push(`${rel}:${lineOf(css, m.index)}: recurso CSS evitado: ${rule.name}`);
  }
}

if (problems.length) {
  console.error('Problemas de compatibilidade encontrados:\n' + problems.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log('OK: scripts analisáveis como ES5, sem APIs modernas listadas; CSS sem recursos evitados.');
