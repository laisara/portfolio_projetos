'use strict';
/*
 * Roteiro de navegação executado no simulador (run-simulation.js).
 * Usa só as teclas do controle remoto (up/down/left/right/select/back) e
 * confere as transições pelos rastros AURORA_* impressos pelo app.
 */
module.exports = async function scenario({ press, shot, page, logs, check, relaunch }) {
  const nav = (tab, zone, overlay = 'none') => new RegExp(`AURORA_NAV tab=${tab} zone=${zone} overlay=${overlay}`);

  // 1. Favoritos vazios: o foco permanece na barra (nada a focar).
  await press('up');
  await check(nav('home', 'nav'), 'Cima no destaque sobe para a barra de abas');
  await press('right', 'right', 'right', 'right', 'select');
  await check(nav('favorites', 'nav'), 'OK na aba Favoritos abre a aba e mantém o foco na barra');
  await shot('02-favoritos-vazio');
  await press('down');
  await check(null, 'Baixo em Favoritos vazio não gera transição de foco', () => !logs.since().some((l) => /zone=content/.test(l)));
  await press('back');
  await check(nav('home', 'nav'), 'Voltar em outra aba retorna ao Início');

  // 2. Destaque -> fileiras -> detalhes -> favoritar -> voltar com foco restaurado.
  await press('down');
  await check(nav('home', 'content'), 'Baixo na barra entra no conteúdo');
  await press('down');
  await shot('03-fileiras');
  await press('right', 'select');
  await check(nav('home', 'overlay', 'details'), 'OK num cartão abre os detalhes');
  await shot('04-detalhes');
  await press('right', 'select');
  await check(/AURORA_TOAST Órbita Baixa foi adicionado aos favoritos/, 'Favoritar pelos detalhes mostra o aviso');
  await shot('05-favoritado');
  await press('left', 'select');
  await check(/AURORA_TOAST Conteúdo demonstrativo: a reprodução não está disponível/, 'Ação principal avisa que é demonstrativo');
  await shot('06-assistir-demonstrativo');
  await press('back');
  await check(nav('home', 'content'), 'Voltar fecha os detalhes');
  await check(/AURORA_FOCUS s03/, 'Foco restaurado no cartão de origem (Órbita Baixa)');
  await shot('07-foco-restaurado');

  // 3. Coleção -> aba Filmes na fileira correspondente. Ao descer, o
  //    RowList mantém a coluna (2ª): o foco já cai em "Drama e romance".
  await press('down', 'select');
  await check(nav('movies', 'content'), 'Coleção abre a aba Filmes com foco no conteúdo');
  await shot('08-colecao-filmes');
  await press('select');
  await check(nav('movies', 'overlay', 'details'), 'Detalhes a partir de Filmes');
  await press('back');
  await check(/AURORA_FOCUS m0[268]/, 'Foco restaurado na fileira "Drama e romance"');
  await press('up', 'up');
  await check(nav('movies', 'nav'), 'Cima na primeira fileira sobe para a barra');

  // 4. Favoritos com conteúdo.
  await press('right', 'right', 'right', 'select', 'down');
  await check(nav('favorites', 'content'), 'Favoritos com item recebe foco');
  await shot('09-favoritos');

  // 5. Configurações: alterna o tema (funcional).
  await press('up', 'right', 'select', 'down');
  await check(nav('settings', 'content'), 'Configurações recebe foco');
  await shot('10-configuracoes');
  await press('select');
  await check(/AURORA_TOAST Tema alterado para Aurora Boreal/, 'Tema alternado');
  await shot('11-tema-boreal');

  // 6. Biblioteca com progresso fictício.
  await press('up', 'left', 'left', 'select', 'down');
  await check(nav('library', 'content'), 'Biblioteca recebe foco');
  await shot('12-biblioteca');

  // 7. Hierarquia do Voltar até sair.
  await press('back');
  await check(nav('home', 'nav'), 'Voltar na Biblioteca volta ao Início (barra)');
  await shot('13-inicio-boreal');
  await press('back');
  await check(/EXIT_USER_NAV|Finished .*Aurora TV/, 'Voltar na barra do Início encerra o app (comportamento do sistema)');

  // 8. Reabertura: tema e favoritos persistidos no registro.
  await relaunch();
  await shot('14-reaberto-persistido');
  await press('up', 'right', 'right', 'right', 'right', 'select', 'down');
  await check(nav('favorites', 'content'), 'Favorito persistiu após reabrir o app');
  await shot('15-favoritos-persistidos');
};
