/*
 * Minha biblioteca: a interface só conhece o contrato do provedor
 * (data/library-provider.js); não há acesso real a mídia.
 */
(function (root) {
  var SH = root.SmartHub;

  function messageRow(id, className, text) {
    return { id: id, kind: 'custom', render: function (node, el) {
      node.appendChild(el('p', className, text));
    } };
  }

  SH.screens.library = {
    title: 'Minha biblioteca',
    tab: true,

    build: function (ctx) {
      var result = SH.loadLibrary(ctx.libraryProvider(), ctx.logger);
      var rows = [];
      var i, j, section, items;

      if (result.state === 'error') {
        rows.push(messageRow('erro', 'error-state', result.message));
      } else if (result.state === 'empty') {
        rows.push(messageRow('vazio', 'empty-state', result.message));
      } else {
        rows.push(messageRow('aviso', 'notice', 'Conteúdo fictício para demonstração da interface.'));
        for (i = 0; i < result.sections.length; i++) {
          section = result.sections[i];
          items = [];
          for (j = 0; j < section.items.length; j++) {
            items.push({ id: section.items[j].id, label: section.items[j].name, sub: section.items[j].meta,
              monogram: section.title.charAt(0),
              onSelect: function (c) { c.toast('Reprodução indisponível: integração de mídia não comprovada.'); } });
          }
          rows.push({ id: section.id, title: section.title, kind: 'cards', items: items });
        }
      }

      rows.push({ id: 'acoes', kind: 'buttons', items: [
        { id: 'lib-settings', label: 'Configurar fonte de demonstração',
          onSelect: function (c) { c.goToTab('settings'); } }
      ] });
      return rows;
    }
  };
})(this);
