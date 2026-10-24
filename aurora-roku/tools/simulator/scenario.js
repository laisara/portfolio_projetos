'use strict';
/*
 * Roteiro de navegação executado no simulador (run-simulation.js).
 * Usa só as teclas do controle remoto (up/down/left/right/select/back) e
 * confere as transições pelos rastros AURORA_* impressos pelo app.
 */

// Posição de cada caractere no teclado da Busca (A-Z, depois 0-9; 9 por linha).
const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const keyPos = (ch) => ({ row: Math.floor(KEYS.indexOf(ch) / 9), col: KEYS.indexOf(ch) % 9 });

module.exports = async function scenario({ press, shot, settle, logs, check, relaunch }) {
  const nav = (tab, zone, overlay = 'none') => new RegExp(`AURORA_NAV tab=${tab} zone=${zone} overlay=${overlay}`);
  const noLine = (re) => () => !logs.since().some((l) => re.test(l));
  const repeat = (key, n) => Array(n).fill(key);

  // Digita um texto no teclado da Busca usando só as setas e OK.
  let pos = { row: 0, col: 0 };
  async function type(text) {
    for (const ch of text) {
      const t = keyPos(ch);
      const vertical = t.row > pos.row ? repeat('down', t.row - pos.row) : repeat('up', pos.row - t.row);
      const horizontal = t.col > pos.col ? repeat('right', t.col - pos.col) : repeat('left', pos.col - t.col);
      await press(...vertical, ...horizontal, 'select');
      pos = t;
    }
  }

  // ---------------------------------------------------------------- 1. Banner em carrossel
  await check(/AURORA_BANNER 1\/5 m07/, 'Banner 1 de 5 aparece na abertura');
  await press('right');
  await check(/AURORA_BANNER 2\/5 m09/, 'Direita avança para o banner 2');
  await shot('02-banner-2');
  await press('right', 'right', 'right');
  await check(/AURORA_BANNER 5\/5 s07/, 'Três vezes à direita chegam ao banner 5');
  await press('right');
  await check(null, 'Direita no último banner é consumida (sem dar a volta)', noLine(/AURORA_BANNER/));
  await press('left', 'left', 'left', 'left');
  await check(/AURORA_BANNER 1\/5 m07/, 'Quatro vezes à esquerda voltam ao banner 1');
  await press('left');
  await check(null, 'Esquerda no primeiro banner é consumida', noLine(/AURORA_BANNER/));

  // ---------------------------------------------------------------- 2. Detalhes do banner
  await press('select');
  await check(/AURORA_DETAILS m07/, 'OK no banner abre os detalhes do título em destaque');
  await check(nav('home', 'overlay', 'details'), 'Foco vai para a camada de detalhes');
  await shot('03-detalhes');
  await press('back');
  await check(nav('home', 'content'), 'Voltar fecha os detalhes e devolve o foco ao banner');

  // ---------------------------------------------------------------- 3. Fileiras da tela inicial
  await press('down');
  await check(/AURORA_HOME zone=rows animations=true/, 'Baixo no banner entra nas fileiras (animação ligada)');
  await shot('04-fileiras');
  await press('down', 'right', 'right', 'select');
  await check(/AURORA_DETAILS m09/, 'Fileira "Em alta": 3º título é A Torre de Cinzas');
  await press('back');
  await check(/AURORA_FOCUS m09/, 'Foco restaurado no mesmo cartão da 2ª fileira');
  await press(...repeat('down', 5), 'select');
  await check(/AURORA_DETAILS a0\d/, 'Fileira "Seus aplicativos" (7ª) abre um aplicativo');
  await shot('05-detalhes-aplicativo');
  await press('select');
  await check(/AURORA_TOAST Conteúdo demonstrativo: o aplicativo não pode ser aberto/, 'Abrir aplicativo avisa que é demonstrativo');
  await press('back');
  await check(/AURORA_FOCUS a0\d/, 'Foco restaurado no cartão de aplicativo');
  await press(...repeat('up', 6));
  await check(null, 'Cima passa pelas 6 fileiras acima sem sair das fileiras', noLine(/AURORA_HOME zone=hero/));
  await press('up');
  await check(/AURORA_HOME zone=hero/, 'Cima na primeira fileira devolve o foco ao banner');
  await press('up');
  await check(nav('home', 'nav'), 'Cima no banner sobe para a barra de abas');

  // ---------------------------------------------------------------- 4. Filmes, Séries, Aplicativos
  await press('right', 'select', 'down');
  await check(nav('movies', 'content'), 'Filmes recebe o foco no conteúdo');
  await shot('06-filmes');
  await press('select');
  await check(/AURORA_DETAILS m07/, 'Primeiro filme da fileira "Ficção científica e fantasia"');
  await press('back');
  await check(/AURORA_FOCUS m07/, 'Foco restaurado em Filmes');
  await press('up', 'right', 'select', 'down');
  await check(nav('series', 'content'), 'Séries recebe o foco no conteúdo');
  await shot('07-series');
  await press('up', 'right', 'select', 'down');
  await check(nav('apps', 'content'), 'Aplicativos recebe o foco no conteúdo');
  await shot('08-aplicativos');
  await press('select');
  await check(/AURORA_DETAILS a01/, 'Primeiro aplicativo: Telão');
  await press('back');

  // ---------------------------------------------------------------- 5. Biblioteca com Favoritos
  await press('up', 'right', 'select', 'down');
  await check(nav('library', 'content'), 'Biblioteca recebe o foco no conteúdo');
  await shot('09-biblioteca');
  await press('select');
  await check(/AURORA_DETAILS m02/, 'Biblioteca: primeiro título de "Continue assistindo"');
  await press('right', 'select');
  await check(/AURORA_TOAST A Última Estação foi adicionado aos favoritos/, 'Favoritar pelos detalhes mostra o aviso');
  await press('back');
  await check(nav('library', 'content'), 'Voltar à Biblioteca');
  await press('down', 'select');
  await check(/AURORA_DETAILS m02/, 'A fileira Favoritos apareceu na Biblioteca com o título favoritado');
  await shot('10-biblioteca-favoritos');
  await press('back');

  // ---------------------------------------------------------------- 6. Busca
  // Da 2ª fileira (Favoritos) à barra: dois "cima".
  await press('up', 'up', 'right', 'select');
  await check(nav('search', 'nav'), 'Aba Busca abre com o foco na barra');
  await press('down');
  await check(nav('search', 'content'), 'Baixo entra no teclado');
  await shot('11-busca-sugestoes');
  await type('ORBITA');
  await check(/AURORA_SEARCH query=ORBITA results=1/, 'ORBITA (sem acento) encontra Órbita Baixa');
  await shot('12-busca-orbita');
  // Do teclado aos resultados (Baixo na última linha) e volta.
  await press(...repeat('down', 4), 'down');
  await press('select');
  await check(/AURORA_DETAILS s03/, 'Resultado da busca abre os detalhes');
  await press('back');
  await check(/AURORA_FOCUS s03/, 'Foco restaurado no resultado');
  await press('up', 'right', 'select');
  await check(/AURORA_SEARCH query=ORBIT results=1/, 'Apagar remove a última letra');
  await press(...repeat('select', 5));
  await check(/AURORA_SEARCH query= results=0/, 'Apagar até esvaziar volta às sugestões');
  // De "Apagar" (4,1) dois "cima" levam a (3,6) e (2,6); o Z fica em (2,7).
  await press('up', 'up');
  pos = { row: 2, col: 6 };
  await type('ZZZ');
  await check(/AURORA_SEARCH query=ZZZ results=0/, 'Texto sem correspondência não retorna resultados');
  await shot('13-busca-sem-resultados');
  await press('down', 'down', 'down');
  await check(null, 'Baixo na última linha, sem resultados, não leva o foco a lugar nenhum', noLine(/AURORA_NAV|AURORA_FOCUS|AURORA_DETAILS/));
  await press('back');
  await check(nav('home', 'nav'), 'Voltar na Busca leva ao Início (barra)');

  // ---------------------------------------------------------------- 7. Configurações: tema e animações
  await press(...repeat('right', 6), 'select', 'down');
  await check(nav('settings', 'content'), 'Configurações recebe o foco');
  await shot('14-configuracoes');
  await press('select');
  await check(/AURORA_TOAST Tema alterado para Aurora Boreal/, 'Tema alternado');
  await shot('15-tema-boreal');
  await press('down', 'select');
  await check(/AURORA_TOAST Animações desligadas/, 'Animações desligadas');
  await press('back');
  await check(nav('home', 'nav'), 'Voltar nas Configurações leva ao Início');
  await press('down', 'down');
  await check(/AURORA_HOME zone=rows animations=false/, 'Sem animações: as fileiras abrem direto no estado final');
  await shot('16-inicio-sem-animacao');

  // ---------------------------------------------------------------- 8. Saída
  await press('up', 'up', 'back');
  await check(/EXIT_USER_NAV|Finished .*Aurora TV/, 'Voltar na barra do Início encerra o app (comportamento do sistema)');

  // ---------------------------------------------------------------- 9. Reabertura: persistência
  await relaunch();
  await shot('17-reaberto-persistido');
  await press('down', 'down');
  await check(/AURORA_HOME zone=rows animations=false/, 'Animações desligadas persistiram após reabrir');
  // Após reabrir, "baixo" ×2 deixa o foco na 2ª fileira: três "cima" levam
  // à barra (fileira 1, banner e barra).
  await press('up', 'up', 'up', 'right', 'right', 'right', 'right', 'select', 'down', 'down', 'select');
  await check(/AURORA_DETAILS m02/, 'Favorito persistiu após reabrir o app');
};
