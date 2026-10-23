/*
 * Tela Início: destaque, favoritos, atalhos para módulos e sistema.
 */
(function (root) {
  var SH = root.SmartHub;

  function favoriteItems(ctx) {
    var ids = ctx.prefs.get('favorites');
    var items = [];
    var i, service;
    for (i = 0; i < ids.length; i++) {
      service = SH.catalog.findService(ids[i]);
      if (service) {
        items.push({
          id: 'fav-' + service.id, label: service.name, monogram: service.monogram,
          sub: SH.SERVICE_STATUS[service.status].label,
          onSelect: openService(service.id)
        });
      }
    }
    return items;
  }

  function openService(id) {
    return function (ctx) { ctx.open('service', { id: id }); };
  }

  function goTab(id) {
    return function (ctx) { ctx.goToTab(id); };
  }

  SH.screens.home = {
    title: 'Início',
    tab: true,

    build: function (ctx) {
      var highlights = SH.catalog.highlights;
      var heroItems = [];
      var favorites = favoriteItems(ctx);
      var i;

      for (i = 0; i < highlights.length; i++) {
        heroItems.push({ id: 'hl-' + highlights[i].id, label: highlights[i].title, sub: highlights[i].text,
          kicker: 'Dica ' + (i + 1) + ' de ' + highlights.length,
          onSelect: highlights[i].id === 'favoritos' ? goTab('entertainment') : null });
      }

      return [
        { id: 'destaque', kind: 'hero', items: heroItems },
        favorites.length ?
          { id: 'favoritos', title: 'Favoritos', kind: 'cards', items: favorites } :
          { id: 'favoritos', title: 'Favoritos', kind: 'custom', render: function (node, el) {
            node.appendChild(el('p', 'empty-state', 'Nenhum favorito. Abra um atalho em Entretenimento para adicioná-lo.'));
          } },
        { id: 'atalhos', title: 'Atalhos', kind: 'cards', items: [
          { id: 'go-entertainment', label: 'Entretenimento', monogram: 'EN', onSelect: goTab('entertainment') },
          { id: 'go-library', label: 'Minha biblioteca', monogram: 'MB', onSelect: goTab('library') },
          { id: 'go-utilities', label: 'Utilitários', monogram: 'UT', onSelect: goTab('utilities') },
          { id: 'go-settings', label: 'Configurações', monogram: 'CF', onSelect: goTab('settings') }
        ] },
        { id: 'sistema', title: 'Sistema', kind: 'cards', items: [
          { id: 'sys-conn', label: 'Conexão', monogram: 'NET',
            sub: ctx.isOnline() ? 'Conectado (informado pela plataforma)' : 'Sem conexão',
            onSelect: function (c) { c.open('connectivity'); } },
          { id: 'sys-platform', label: 'Plataforma', monogram: 'TV', sub: ctx.adapter.name,
            onSelect: function (c) { c.open('diagnostics'); } },
          { id: 'sys-version', label: 'Versão', monogram: 'v', sub: 'Smart Hub ' + SH.version,
            onSelect: function (c) { c.open('about'); } }
        ] }
      ];
    }
  };
})(this);
