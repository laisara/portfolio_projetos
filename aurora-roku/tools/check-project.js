#!/usr/bin/env node
'use strict';
/*
 * Verificação estática do pacote Aurora TV (complementa o BrighterScript).
 *
 * Checa o que o compilador não cobre: manifest e dimensões de imagens,
 * referências pkg:/ (inclusive as montadas a partir do catálogo e dos
 * temas), nós SceneGraph usados no XML e no código, callbacks de
 * observeField/onChange, ausência de URLs e credenciais, rótulos de
 * conteúdo demonstrativo e grade de 3 px recomendada pela Roku para FHD.
 *
 * Passar aqui NÃO significa que o app roda no Roku: só que a estrutura é
 * coerente. Só usa a biblioteca padrão do Node.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const APP_DIRS = ['source', 'components', 'images'];
const errors = [];
const warnings = [];
const notes = [];

const rel = (p) => path.relative(ROOT, p);
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (pkgPath) => fs.existsSync(path.join(ROOT, pkgPath.replace(/^pkg:\//, '')));

function walk(dir, filter) {
  let out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full, filter));
    else if (!filter || filter(full)) out.push(full);
  }
  return out;
}

// Dimensões de PNG (IHDR) e JPEG (marcador SOF) lidas do cabeçalho.
function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b.slice(1, 4).toString() === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xc3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + len;
    }
  }
  return null;
}

// Nós nativos usados pelo app. Cada um aparece na documentação de
// referência SceneGraph da Roku (ver SOURCES.md).
const BUILTIN_NODES = new Set([
  'Scene', 'Group', 'Poster', 'Label', 'Rectangle', 'RowList', 'Animation',
  'Vector2DFieldInterpolator', 'FloatFieldInterpolator', 'Timer', 'Font', 'ContentNode',
]);

// ---------------------------------------------------------------- estrutura
for (const required of ['manifest', 'source/main.brs', 'components', 'images']) {
  if (!fs.existsSync(path.join(ROOT, required))) errors.push(`Estrutura: falta ${required}`);
}

// ---------------------------------------------------------------- manifest
const manifest = {};
read(path.join(ROOT, 'manifest')).split('\n').forEach((line, n) => {
  if (!line.trim() || line.trim().startsWith('#')) return;
  const m = line.match(/^([a-z_0-9]+)=(.*)$/);
  if (!m) errors.push(`manifest:${n + 1}: linha fora do formato nome=valor: "${line}"`);
  else manifest[m[1]] = m[2].trim();
});
for (const key of ['title', 'major_version', 'minor_version', 'build_version']) {
  if (!manifest[key]) errors.push(`manifest: atributo obrigatório ausente: ${key}`);
}
for (const key of ['major_version', 'minor_version', 'build_version']) {
  if (manifest[key] && !/^\d+$/.test(manifest[key])) errors.push(`manifest: ${key} deve ser numérico`);
}
if (manifest.ui_resolutions && !manifest.ui_resolutions.split(',').every((r) => ['sd', 'hd', 'fhd'].includes(r.trim()))) {
  errors.push(`manifest: ui_resolutions inválido: ${manifest.ui_resolutions}`);
}
const expectedSizes = {
  mm_icon_focus_fhd: [540, 405], mm_icon_focus_hd: [290, 218],
  splash_screen_fhd: [1920, 1080], splash_screen_hd: [1280, 720],
};
for (const [key, [w, h]] of Object.entries(expectedSizes)) {
  const value = manifest[key];
  if (!value) { errors.push(`manifest: ${key} ausente`); continue; }
  if (!exists(value)) { errors.push(`manifest: ${key} aponta para arquivo inexistente: ${value}`); continue; }
  const size = imageSize(path.join(ROOT, value.replace('pkg:/', '')));
  if (!size || size.w !== w || size.h !== h) errors.push(`manifest: ${key} deveria ter ${w}x${h}, tem ${size && size.w}x${size && size.h}`);
}

// ---------------------------------------------------------------- componentes
const xmlFiles = walk(path.join(ROOT, 'components'), (f) => f.endsWith('.xml'));
const components = {};
for (const file of xmlFiles) {
  const xml = read(file);
  const m = xml.match(/<component\s+name="([^"]+)"\s+extends="([^"]+)"/);
  if (!m) { errors.push(`${rel(file)}: elemento <component name extends> não encontrado`); continue; }
  const [, name, ext] = m;
  if (components[name]) errors.push(`${rel(file)}: componente duplicado ${name}`);
  if (path.basename(file, '.xml') !== name) warnings.push(`${rel(file)}: nome do arquivo difere do componente ${name}`);
  const scripts = [...xml.matchAll(/<script[^>]*uri="([^"]+)"/g)].map((s) => s[1]);
  components[name] = { file, xml, ext, scripts };
}
const isNode = (n) => BUILTIN_NODES.has(n) || Boolean(components[n]);

for (const [name, c] of Object.entries(components)) {
  if (!isNode(c.ext)) errors.push(`${rel(c.file)}: extends="${c.ext}" não é nó conhecido`);
  let code = '';
  for (const uri of c.scripts) {
    if (!exists(uri)) errors.push(`${rel(c.file)}: script inexistente ${uri}`);
    else code += read(path.join(ROOT, uri.replace('pkg:/', ''))) + '\n';
  }
  const defined = new Set([...code.matchAll(/^\s*(?:sub|function)\s+([A-Za-z_][A-Za-z0-9_]*)/gim)].map((x) => x[1].toLowerCase()));
  const children = c.xml.split('<children>')[1] || '';
  for (const tag of new Set([...children.matchAll(/<([A-Z][A-Za-z0-9]*)[\s/>]/g)].map((x) => x[1]))) {
    if (!isNode(tag)) errors.push(`${rel(c.file)}: nó <${tag}> desconhecido`);
  }
  for (const attr of c.xml.matchAll(/itemComponentName="([^"]+)"/g)) {
    if (!components[attr[1]]) errors.push(`${rel(c.file)}: itemComponentName "${attr[1]}" inexistente`);
  }
  for (const cb of c.xml.matchAll(/onChange="([^"]+)"/g)) {
    if (!defined.has(cb[1].toLowerCase())) errors.push(`${rel(c.file)}: onChange="${cb[1]}" sem função correspondente`);
  }
  for (const fn of c.xml.matchAll(/<function\s+name="([^"]+)"/g)) {
    if (!defined.has(fn[1].toLowerCase())) errors.push(`${rel(c.file)}: função de interface ${fn[1]} não implementada`);
  }
  const ownScript = c.scripts.find((s) => s.endsWith(`/${name}.brs`));
  const own = ownScript && exists(ownScript) ? read(path.join(ROOT, ownScript.replace('pkg:/', ''))) : '';
  for (const ob of own.matchAll(/observeField\(\s*"[^"]+"\s*,\s*"([^"]+)"\s*\)/g)) {
    if (!defined.has(ob[1].toLowerCase())) errors.push(`${rel(c.file)}: observeField callback "${ob[1]}" inexistente`);
  }
  for (const nodeRef of code.matchAll(/(?:createChild|CreateObject\("roSGNode",)\s*\(?\s*"([^"]+)"/g)) {
    if (!isNode(nodeRef[1])) errors.push(`${rel(c.file)}: cria nó desconhecido "${nodeRef[1]}"`);
  }
  // Grade de 3 px (recomendação da Roku para layouts FHD).
  for (const attr of c.xml.matchAll(/\b(translation|width|height|itemSize|rowItemSize|rowItemSpacing|itemSpacing|rowLabelOffset|keyValue)="([^"]+)"/g)) {
    const nums = (attr[2].match(/-?\d+(\.\d+)?/g) || []).map(Number).filter((v) => Number.isInteger(v));
    const off = nums.filter((v) => v % 3 !== 0);
    if (off.length && attr[1] !== 'keyValue') warnings.push(`${rel(c.file)}: ${attr[1]}="${attr[2]}" fora da grade de 3 px`);
  }
}
if (!components.MainScene || components.MainScene.ext !== 'Scene') errors.push('MainScene deve existir e estender Scene');
const mainCode = read(path.join(ROOT, 'source/main.brs'));
const scene = (mainCode.match(/CreateScene\("([^"]+)"\)/) || [])[1];
if (!components[scene]) errors.push(`source/main.brs: CreateScene("${scene}") sem componente correspondente`);

// ---------------------------------------------------------------- recursos
const appFiles = APP_DIRS.flatMap((d) => walk(path.join(ROOT, d), (f) => /\.(brs|xml)$/.test(f))).concat([path.join(ROOT, 'manifest')]);
for (const file of appFiles) {
  const text = read(file);
  for (const ref of text.matchAll(/pkg:\/[A-Za-z0-9_./-]+\.(png|jpg|jpeg|brs|xml)/g)) {
    if (!exists(ref[0])) errors.push(`${rel(file)}: referência a arquivo inexistente ${ref[0]}`);
  }
  if (/https?:\/\//i.test(text)) errors.push(`${rel(file)}: contém URL http(s) — o app não deve depender de rede`);
  if (/(password|senha|api[_-]?key|secret|token)\s*[:=]/i.test(text)) errors.push(`${rel(file)}: possível credencial no código`);
}
// Caminhos montados em tempo de execução: catálogo e temas.
const demo = read(path.join(ROOT, 'source/shared/DemoContent.brs'));
const itemIds = [...demo.matchAll(/^\s+([ms]\d\d): \{ title:/gm)].map((m) => m[1]);
const collectionIds = [...demo.matchAll(/id: "(col_[a-z]+)"/g)].map((m) => m[1]);
if (itemIds.length < 10) errors.push('DemoContent: catálogo demonstrativo não encontrado ou incompleto');
for (const id of itemIds) {
  for (const p of [`images/posters/${id}.png`, `images/backgrounds/${id}.jpg`]) {
    if (!fs.existsSync(path.join(ROOT, p))) errors.push(`Imagem ausente para ${id}: ${p}`);
  }
}
for (const id of collectionIds) {
  if (!fs.existsSync(path.join(ROOT, `images/posters/${id}.png`))) errors.push(`Imagem ausente para coleção ${id}`);
}
const theme = read(path.join(ROOT, 'source/shared/Theme.brs'));
const themeIds = JSON.parse((theme.match(/return (\["[^\]]+\])/) || [, '[]'])[1]);
const themeFiles = [...theme.matchAll(/base \+ "([^"]+)"/g)].map((m) => m[1]);
for (const id of themeIds) {
  for (const f of themeFiles) if (!fs.existsSync(path.join(ROOT, 'images/ui', id, f))) errors.push(`Tema ${id}: falta images/ui/${id}/${f}`);
  if (!fs.existsSync(path.join(ROOT, `images/backgrounds/bg_${id}.jpg`))) errors.push(`Tema ${id}: falta fundo bg_${id}.jpg`);
}
// As cores do gerador de arte devem ser as mesmas do tema.
const gen = read(path.join(ROOT, 'tools/generate_assets.py'));
for (const m of theme.matchAll(/(background|surface|accent): "0x([0-9A-F]{6})FF"/g)) {
  if (!gen.toUpperCase().includes(`#${m[2]}`)) errors.push(`Cor ${m[1]} 0x${m[2]} do tema não aparece em tools/generate_assets.py`);
}

// ---------------------------------------------------------------- 9-patch
for (const f of walk(path.join(ROOT, 'images/ui'), (x) => x.endsWith('.9.png'))) {
  const s = imageSize(f);
  if (!s || s.w < 5 || s.h < 5) errors.push(`${rel(f)}: 9-patch inválido`);
}

// ---------------------------------------------------------------- rótulos demonstrativos
if (!/fictícios|INVENTADOS/i.test(demo)) errors.push('DemoContent.brs deve declarar que os dados são fictícios');
const uiCode = walk(path.join(ROOT, 'components'), (f) => f.endsWith('.brs')).map(read).join('\n') + theme;
for (const phrase of ['demonstrativ', 'Versão demonstrativa', 'Nenhum vídeo é reproduzido', 'reprodução não está disponível']) {
  if (!uiCode.includes(phrase)) errors.push(`Interface sem a mensagem obrigatória contendo "${phrase}"`);
}

// ---------------------------------------------------------------- memória e tamanho
let bytes = 0;
let maxTexture = { file: '', mb: 0 };
for (const f of walk(path.join(ROOT, 'images'))) {
  bytes += fs.statSync(f).size;
  const s = imageSize(f);
  // Ícone e splash são exibidos pelo sistema, não carregados pela UI.
  const loadedByUi = !rel(f).startsWith('images/brand/') || rel(f).endsWith('brand_mark.png');
  if (s) {
    const mb = (s.w * s.h * 4) / (1024 * 1024);
    if (loadedByUi && mb > maxTexture.mb) maxTexture = { file: rel(f), mb };
    if (s.w > 1920 || s.h > 1080) errors.push(`${rel(f)}: maior que a resolução de UI (${s.w}x${s.h})`);
  }
}
for (const d of ['source', 'components']) walk(path.join(ROOT, d)).forEach((f) => { bytes += fs.statSync(f).size; });
notes.push(`Tamanho estimado do pacote (sem compressão do zip): ${(bytes / 1024).toFixed(0)} KB`);
notes.push(`Maior textura carregada pela UI: ${maxTexture.file} ≈ ${maxTexture.mb.toFixed(1)} MB (4 bytes/pixel, regra da Roku)`);
notes.push(`Componentes: ${Object.keys(components).length} · títulos demonstrativos: ${itemIds.length} · temas: ${themeIds.length}`);

// ---------------------------------------------------------------- saída
for (const n of notes) console.log('info  ' + n);
for (const w of warnings) console.log('aviso ' + w);
if (errors.length) {
  for (const e of errors) console.log('ERRO  ' + e);
  console.log(`\n${errors.length} erro(s).`);
  process.exit(1);
}
console.log(`\nOK: estrutura verificada (${warnings.length} aviso(s)).`);
