/*
 * Configurações: tema, preferências de interface, atalhos, versão e
 * opções de simulação usadas para testar estados da biblioteca.
 */
(function (root) {
  var SH = root.SmartHub;

  var LABELS = {
    accent: { ciano: 'Ciano', azul: 'Azul' },
    textSize: { normal: 'Normal', grande: 'Grande' }
  };

  function onOff(value) { return value ? 'Ativado' : 'Desativado'; }

  function cycle(key) {
    return function (c) {
      c.prefs.cycle(key);
      c.applyPreferences();
      c.rerender();
    };
  }

  SH.screens.settings = {
    title: 'Configurações',
    tab: true,

    build: function (ctx) {
      var p = ctx.prefs;
      return [
        { id: 'aparencia', title: 'Aparência', kind: 'options', items: [
          { id: 'opt-accent', label: 'Cor de destaque', value: LABELS.accent[p.get('accent')], onSelect: cycle('accent') },
          { id: 'opt-text', label: 'Tamanho do texto', value: LABELS.textSize[p.get('textSize')], onSelect: cycle('textSize') },
          { id: 'opt-anim', label: 'Animações', value: onOff(p.get('animations')), onSelect: cycle('animations') }
        ] },
        { id: 'atalhos', title: 'Atalhos', kind: 'options', items: [
          { id: 'opt-favorites', label: 'Favoritos', value: p.get('favorites').length + ' atalho(s)',
            onSelect: function (c) { c.goToTab('entertainment'); } },
          { id: 'opt-reset', label: 'Restaurar padrões', value: 'OK para restaurar',
            onSelect: function (c) {
              c.prefs.reset();
              c.applyPreferences();
              c.toast('Preferências restauradas');
              c.rerender();
            } }
        ] },
        { id: 'simulacao', title: 'Simulação (desenvolvimento)', kind: 'options', items: [
          { id: 'opt-demo-media', label: 'Biblioteca de demonstração', value: onOff(p.get('demoMedia')), onSelect: cycle('demoMedia') },
          { id: 'opt-lib-error', label: 'Simular falha da biblioteca', value: onOff(p.get('simulateLibraryError')),
            onSelect: cycle('simulateLibraryError') }
        ] },
        { id: 'sobre', title: 'Sobre', kind: 'options', items: [
          { id: 'opt-about', label: 'Versão', value: 'Smart Hub ' + SH.version, onSelect: function (c) { c.open('about'); } },
          { id: 'opt-diag', label: 'Diagnóstico', value: 'Abrir', onSelect: function (c) { c.open('diagnostics'); } }
        ] }
      ];
    }
  };

  SH.screens.about = {
    title: 'Sobre',

    build: function (ctx) {
      return [
        { id: 'sobre', kind: 'custom', render: function (node, el) {
          node.appendChild(el('h1', 'detail-title', 'Smart Hub Personalizado ' + SH.version));
          node.appendChild(el('p', 'detail-text', 'Protótipo de interface para a Samsung UN48H4203AG.'));
          node.appendChild(el('p', 'detail-text', 'Ambiente atual: ' + ctx.adapter.name + '.'));
          node.appendChild(el('p', 'detail-text',
            'Este protótipo não comprova compatibilidade com a TV. Consulte docs/FEASIBILITY.md.'));
        } },
        { id: 'acoes', kind: 'buttons', items: [
          { id: 'voltar', label: 'Voltar', onSelect: function (c) { c.back(); } }
        ] }
      ];
    }
  };
})(this);
