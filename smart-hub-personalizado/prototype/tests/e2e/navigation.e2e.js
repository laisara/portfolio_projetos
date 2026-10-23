#!/usr/bin/env node
'use strict';
/*
 * Testes de ponta a ponta no Chromium (Playwright), usando apenas o
 * teclado para simular o controle remoto.
 *
 * Playwright NÃO é dependência do projeto (é grande e baixa navegadores).
 * O script usa uma instalação existente: local (node_modules) ou global
 * (via NODE_PATH). Sucesso aqui só prova o comportamento num navegador
 * moderno — não na TV.
 *
 * Uso: node prototype/tests/e2e/navigation.e2e.js [pasta-de-capturas]
 */
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  console.error('Playwright não encontrado. Instale-o (npm i -D playwright) ou defina NODE_PATH ' +
    'para uma instalação global. Teste e2e não executado.');
  process.exit(2);
}

const PAGE = 'file://' + path.join(__dirname, '..', '..', 'index.html');
const SHOTS = process.argv[2] || path.join(__dirname, 'output');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];

async function step(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log('ok     - ' + name);
  } catch (err) {
    results.push({ name, ok: false });
    console.log('FALHOU - ' + name + '\n         ' + err.message.split('\n').join('\n         '));
  }
}

async function main() {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  const focused = () => page.evaluate(() => SmartHub.app.focusedItemId());
  const screen = () => page.evaluate(() => SmartHub.app.currentScreenId());
  const press = async (...keys) => { for (const k of keys) await page.keyboard.press(k); };
  const toast = () => page.textContent('#toast');

  await page.goto(PAGE);

  await step('carrega sem erros e inicia na tela Início com foco no destaque', async () => {
    assert.equal(await screen(), 'home');
    assert.equal(await focused(), 'hl-boas-vindas');
    assert.equal(await page.isVisible('#simulation-badge'), true, 'selo SIMULAÇÃO visível');
    await page.screenshot({ path: path.join(SHOTS, 'inicio.png') });
  });

  await step('navegação horizontal e vertical previsível', async () => {
    await press('ArrowRight');
    assert.equal(await focused(), 'hl-favoritos');
    await press('ArrowDown');
    assert.equal(await focused(), 'fav-radio', 'mantém a coluna 1');
    await press('ArrowDown');
    assert.equal(await focused(), 'go-library');
    await press('ArrowUp');
    assert.equal(await focused(), 'fav-radio', 'volta para a coluna lembrada');
    await press('ArrowLeft', 'ArrowLeft', 'ArrowLeft');
    assert.equal(await focused(), 'fav-youtube', 'para no início da linha sem perder o foco');
    await press('ArrowUp', 'ArrowUp', 'ArrowUp');
    assert.equal(await focused(), 'tab-home', 'chega à barra de abas e não sai dela');
  });

  await step('segurar a seta não atropela a navegação', async () => {
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('ArrowRight');
    await page.keyboard.up('ArrowRight');
    assert.equal(await focused(), 'tab-entertainment', 'repetições imediatas ignoradas');
    await press('ArrowLeft');
  });

  await step('seleção de aba, abertura de cartão e retorno com foco restaurado', async () => {
    await press('ArrowRight', 'Enter');
    assert.equal(await screen(), 'entertainment');
    assert.equal(await focused(), 'tab-entertainment', 'foco permanece na aba');
    await press('ArrowDown');
    assert.equal(await focused(), 'svc-youtube', 'desce da aba para o primeiro cartão');
    await press('ArrowRight');
    assert.equal(await focused(), 'svc-netflix');
    await press('Enter');
    assert.equal(await screen(), 'service');
    assert.equal(await focused(), 'favoritar');
    await page.screenshot({ path: path.join(SHOTS, 'detalhe-servico.png') });
    await press('Enter');
    assert.match(await toast(), /adicionado aos favoritos/);
    await press('Backspace');
    assert.equal(await screen(), 'entertainment');
    assert.equal(await focused(), 'svc-netflix', 'foco restaurado');
    await page.screenshot({ path: path.join(SHOTS, 'entretenimento.png') });
  });

  await step('"Abrir aplicativo" informa que não há integração comprovada', async () => {
    await press('Enter', 'ArrowRight', 'Enter');
    assert.match(await toast(), /não comprovado/);
    await press('Escape');
    assert.equal(await screen(), 'entertainment');
  });

  await step('preferências persistem após recarregar (favorito e cor de destaque)', async () => {
    await press('ArrowUp', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'Enter');
    assert.equal(await screen(), 'settings');
    await press('ArrowDown');
    assert.equal(await focused(), 'opt-accent');
    await press('Enter');
    assert.match(await page.getAttribute('body', 'class'), /accent-azul/);
    await page.screenshot({ path: path.join(SHOTS, 'configuracoes.png') });
    await page.reload();
    assert.match(await page.getAttribute('body', 'class'), /accent-azul/);
    const ids = await page.$$eval('[data-row-id="favoritos"] .card', (els) => els.map((e) => e.getAttribute('data-item-id')));
    assert.ok(ids.includes('fav-netflix'), 'Netflix nos favoritos: ' + ids.join(','));
  });

  await step('biblioteca: estado vazio, erro de integração e dados de demonstração', async () => {
    await press('ArrowUp', 'ArrowRight', 'ArrowRight', 'Enter');
    assert.equal(await screen(), 'library');
    assert.equal(await page.isVisible('.empty-state'), true);
    await page.screenshot({ path: path.join(SHOTS, 'biblioteca-vazia.png') });
    await press('ArrowDown', 'Enter');
    assert.equal(await screen(), 'settings', 'atalho leva às configurações');
    // Linhas: abas, Aparência, Atalhos, Simulação, Sobre.
    await press('ArrowDown', 'ArrowDown', 'ArrowRight', 'Enter');
    assert.equal(await focused(), 'opt-lib-error');
    await press('ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowLeft', 'ArrowLeft', 'Enter');
    assert.equal(await screen(), 'library');
    assert.equal(await page.isVisible('.error-state'), true, 'erro exibido sem quebrar a tela');
    await page.screenshot({ path: path.join(SHOTS, 'biblioteca-erro.png') });
    await press('ArrowDown', 'Enter', 'ArrowDown', 'ArrowDown', 'Enter', 'ArrowRight', 'Enter');
    assert.equal(await focused(), 'opt-lib-error');
    await press('ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowLeft', 'ArrowLeft', 'Enter');
    assert.equal(await page.isVisible('.error-state'), false);
    assert.ok((await page.$$('[data-row-id="videos"] .card')).length > 0, 'cartões de demonstração');
  });

  await step('sem internet: indicador muda e utilitários continuam funcionando', async () => {
    await context.setOffline(true);
    await page.waitForFunction(() => document.getElementById('header-network').textContent === 'Sem conexão');
    await press('ArrowUp', 'ArrowRight', 'Enter', 'ArrowDown', 'Enter');
    assert.equal(await screen(), 'clock');
    assert.match(await page.textContent('.big-clock'), /^\d\d:\d\d:\d\d$/);
    await page.screenshot({ path: path.join(SHOTS, 'relogio-offline.png') });
    await press('Backspace', 'ArrowRight', 'Enter');
    assert.equal(await screen(), 'calendar');
    const before = await page.textContent('.detail-title');
    await press('ArrowRight', 'Enter');
    assert.notEqual(await page.textContent('.detail-title'), before, 'próximo mês');
    await press('Backspace');
    await context.setOffline(false);
  });

  await step('Voltar em uma aba leva ao Início; no Início pede confirmação para sair', async () => {
    await press('Backspace');
    assert.equal(await screen(), 'home');
    await press('Backspace');
    assert.match(await toast(), /novamente para sair/);
    await press('Backspace');
    assert.match(await toast(), /não está disponível na simulação/);
  });

  await step('a tela lógica 16:9 cabe em diferentes resoluções', async () => {
    for (const [w, h] of [[1920, 1080], [1366, 768], [1280, 720], [1024, 768], [800, 600]]) {
      await page.setViewportSize({ width: w, height: h });
      // Aguarda o evento resize ser processado.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const box = await page.locator('#stage').boundingBox();
      assert.ok(box.x >= 0 && box.y >= 0, `${w}x${h}: posição`);
      assert.ok(box.x + box.width <= w + 1 && box.y + box.height <= h + 1, `${w}x${h}: cabe na janela`);
      assert.ok(Math.abs(box.width / box.height - 16 / 9) < 0.01, `${w}x${h}: proporção`);
    }
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.screenshot({ path: path.join(SHOTS, 'inicio-1366x768.png') });
  });

  await step('nenhum erro de JavaScript durante a sessão', async () => {
    assert.deepEqual(pageErrors, []);
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed} de ${results.length} cenários passaram. Capturas em ${SHOTS}`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
