'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

const SH = load([
  'core/logger.js', 'core/storage.js', 'core/preferences.js', 'core/keys.js',
  'core/focus.js', 'core/router.js', 'core/clock.js',
  'data/catalog.js', 'data/library-provider.js'
]);

// O vm usa outro realm: comparar objetos via JSON evita falsos negativos.
const plain = (v) => JSON.parse(JSON.stringify(v));

test('foco: navegação horizontal para nos limites da linha', () => {
  const f = SH.createFocusModel([3]);
  assert.deepEqual(plain(f.get()), { row: 0, col: 0 });
  assert.equal(f.move('LEFT'), false);
  assert.equal(f.move('RIGHT'), true);
  assert.equal(f.move('RIGHT'), true);
  assert.equal(f.move('RIGHT'), false);
  assert.deepEqual(plain(f.get()), { row: 0, col: 2 });
});

test('foco: navegação vertical pula linhas vazias e limita a coluna', () => {
  const f = SH.createFocusModel([5, 0, 2]);
  f.set(0, 4);
  assert.equal(f.move('DOWN'), true);
  assert.deepEqual(plain(f.get()), { row: 2, col: 1 });
  assert.equal(f.move('DOWN'), false);
  assert.equal(f.move('UP'), true);
  // Volta para a coluna lembrada da linha 0.
  assert.deepEqual(plain(f.get()), { row: 0, col: 4 });
  assert.equal(f.move('UP'), false);
});

test('foco: linha com âncora sempre recebe o foco na coluna ancorada', () => {
  const f = SH.createFocusModel([5, 3], [2, undefined]);
  f.set(1, 0);
  assert.equal(f.move('UP'), true);
  assert.deepEqual(plain(f.get()), { row: 0, col: 2 });
  f.move('RIGHT');
  f.move('DOWN');
  f.move('UP');
  assert.deepEqual(plain(f.get()), { row: 0, col: 2 }, 'âncora prevalece sobre a memória');
});

test('foco: sair de linha ancorada não herda a coluna dela', () => {
  const f = SH.createFocusModel([5, 3, 3], [4, undefined, undefined]);
  assert.deepEqual(plain(f.get()), { row: 0, col: 0 });
  f.set(0, 4);
  f.move('DOWN');
  assert.deepEqual(plain(f.get()), { row: 1, col: 0 });
  f.move('RIGHT');
  f.move('DOWN');
  assert.deepEqual(plain(f.get()), { row: 2, col: 1 }, 'linhas comuns mantêm a coluna');
});

test('foco: tela sem itens focáveis não gera posição inválida', () => {
  const f = SH.createFocusModel([0, 0]);
  assert.deepEqual(plain(f.get()), { row: -1, col: 0 });
  assert.equal(f.move('DOWN'), false);
});

test('foco: restaurar estado após mudança das linhas reposiciona no item válido', () => {
  const f = SH.createFocusModel([4, 4]);
  f.set(1, 3);
  const saved = f.getState();
  f.setRows([4, 1]);
  f.restore(saved);
  assert.deepEqual(plain(f.get()), { row: 1, col: 0 });
  f.setRows([4, 0, 0]);
  f.restore(saved);
  assert.equal(f.get().row, 0);
});

test('teclas: mapeamento e ações desconhecidas', () => {
  const k = SH.createKeyMapper({ 37: 'LEFT', 13: 'ENTER' });
  assert.equal(k.actionFor(37), 'LEFT');
  assert.equal(k.actionFor(13), 'ENTER');
  assert.equal(k.actionFor(65), null);
});

test('teclas: segurar seta repete com intervalo mínimo; ENTER não repete', () => {
  let t = 0;
  const g = SH.createRepeatGuard(150, () => t);
  assert.equal(g.keyDown('RIGHT'), true);
  t = 50; assert.equal(g.keyDown('RIGHT'), false);
  t = 160; assert.equal(g.keyDown('RIGHT'), true);
  g.keyUp('RIGHT');
  t = 170; assert.equal(g.keyDown('RIGHT'), true, 'nova pressão passa imediatamente');

  assert.equal(g.keyDown('ENTER'), true);
  t = 2000; assert.equal(g.keyDown('ENTER'), false, 'ENTER segurado não reativa');
  g.keyUp('ENTER');
  assert.equal(g.keyDown('ENTER'), true);
});

test('roteador: empilhar, voltar e trocar raiz', () => {
  const r = SH.createRouter('home');
  assert.equal(r.canGoBack(), false);
  r.push('service', { id: 'youtube' });
  assert.equal(r.current().id, 'service');
  assert.equal(r.current().params.id, 'youtube');
  assert.equal(r.pop(), true);
  assert.equal(r.current().id, 'home');
  assert.equal(r.pop(), false);
  r.push('clock');
  r.replaceRoot('settings');
  assert.equal(r.depth(), 1);
  assert.equal(r.rootId(), 'settings');
});

test('armazenamento: persiste em JSON e lê de volta', () => {
  const backend = SH.createMemoryBackend();
  const s = SH.createStorage(backend, 'teste');
  s.set('a', { x: 1 });
  assert.equal(backend.getItem('teste:a'), '{"x":1}');
  assert.deepEqual(plain(s.get('a')), { x: 1 });
  assert.equal(s.get('inexistente', 'padrão'), 'padrão');
  assert.equal(s.isPersistent(), true);
});

test('armazenamento: valor corrompido devolve padrão', () => {
  const backend = SH.createMemoryBackend();
  backend.setItem('teste:a', '{quebrado');
  const s = SH.createStorage(backend, 'teste', SH.createLogger());
  assert.equal(s.get('a', 42), 42);
});

test('armazenamento: backend com falha cai para memória sem lançar erro', () => {
  const failing = {
    getItem() { throw new Error('bloqueado'); },
    setItem() { throw new Error('cota excedida'); },
    removeItem() { throw new Error('bloqueado'); }
  };
  const logger = SH.createLogger();
  const s = SH.createStorage(failing, 'teste', logger);
  s.set('a', 1);
  assert.equal(s.get('a'), 1);
  assert.equal(s.isPersistent(), false);
  assert.ok(logger.entries().some((e) => e.level === 'warn'));
});

test('armazenamento: sem backend funciona só em memória', () => {
  const s = SH.createStorage(null, 'teste');
  s.set('a', 'b');
  assert.equal(s.get('a'), 'b');
  assert.equal(s.isPersistent(), false);
});

test('preferências: padrões, ciclo, favoritos e persistência', () => {
  const backend = SH.createMemoryBackend();
  const p = SH.createPreferences(SH.createStorage(backend, 'teste'));
  assert.equal(p.get('accent'), 'ciano');
  assert.equal(p.cycle('accent'), 'azul');
  assert.equal(p.cycle('accent'), 'ciano');
  assert.equal(p.toggleFavorite('netflix'), true);
  assert.equal(p.isFavorite('netflix'), true);

  const reloaded = SH.createPreferences(SH.createStorage(backend, 'teste'));
  assert.equal(reloaded.isFavorite('netflix'), true);
  assert.equal(reloaded.toggleFavorite('netflix'), false);
  assert.throws(() => reloaded.set('accent', 'vermelho'));
});

test('preferências: dados salvos inválidos são substituídos pelos padrões', () => {
  const backend = SH.createMemoryBackend();
  backend.setItem('teste:preferences', JSON.stringify({ accent: 'rosa', animations: 'sim', favorites: 'x' }));
  const p = SH.createPreferences(SH.createStorage(backend, 'teste'));
  assert.equal(p.get('accent'), 'ciano');
  assert.equal(p.get('animations'), true);
  assert.deepEqual(plain(p.get('favorites')), ['youtube', 'radio', 'navegador']);
});

test('relógio: formatação em português sem Intl', () => {
  const d = new Date(2026, 9, 23, 9, 5, 7);
  assert.equal(SH.clock.formatTime(d), '09:05');
  assert.equal(SH.clock.formatTime(d, true), '09:05:07');
  assert.equal(SH.clock.formatDate(d), 'sexta-feira, 23 de outubro');
  assert.equal(SH.clock.formatMonthTitle(2026, 9), 'Outubro de 2026');
});

test('calendário: matriz do mês e troca de mês/ano', () => {
  const weeks = SH.clock.buildMonthMatrix(2026, 1); // fevereiro de 2026 começa num domingo
  assert.equal(weeks.length, 4);
  assert.equal(weeks[0][0], 1);
  assert.equal(weeks[3][6], 28);
  const oct = SH.clock.buildMonthMatrix(2026, 9); // 1/10/2026 é quinta-feira
  assert.equal(oct[0][4], 1);
  assert.equal(oct[0][3], null);
  assert.deepEqual(plain(SH.clock.shiftMonth(2026, 0, -1)), { year: 2025, month: 11 });
  assert.deepEqual(plain(SH.clock.shiftMonth(2026, 11, 1)), { year: 2027, month: 0 });
});

test('biblioteca: estados vazio, demonstração e erro de integração', () => {
  const logger = SH.createLogger();
  assert.equal(SH.loadLibrary(SH.createLibraryProvider('empty'), logger).state, 'empty');
  const demo = SH.loadLibrary(SH.createLibraryProvider('demo'), logger);
  assert.equal(demo.state, 'ready');
  assert.ok(demo.sections.length > 0);
  const failed = SH.loadLibrary(SH.createLibraryProvider('error'), logger);
  assert.equal(failed.state, 'error');
  assert.match(failed.message, /Falha simulada/);
  assert.equal(logger.entries().at(-1).level, 'error');
});

test('catálogo: todo serviço tem status conhecido', () => {
  for (const s of SH.catalog.services) {
    assert.ok(SH.SERVICE_STATUS[s.status], s.id);
  }
  assert.equal(SH.catalog.findService('nao-existe'), null);
});

test('logger: buffer circular respeita o limite', () => {
  const l = SH.createLogger({ limit: 3 });
  for (let i = 0; i < 5; i++) l.info('m' + i);
  assert.deepEqual(plain(l.entries().map((e) => e.message)), ['m2', 'm3', 'm4']);
});
