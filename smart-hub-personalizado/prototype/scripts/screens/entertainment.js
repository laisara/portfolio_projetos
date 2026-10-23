/*
 * Entretenimento: catálogo de atalhos informativos e tela de detalhe.
 * Nenhum atalho abre aplicativo ou reproduz conteúdo: a existência de
 * apps compatíveis com o modelo não foi comprovada.
 */
(function (root) {
  var SH = root.SmartHub;

  function serviceCard(service) {
    return {
      id: 'svc-' + service.id, label: service.name, monogram: service.monogram,
      sub: service.category, badge: SH.SERVICE_STATUS[service.status].label,
      onSelect: function (ctx) { ctx.open('service', { id: service.id }); }
    };
  }

  SH.screens.entertainment = {
    title: 'Entretenimento',
    tab: true,

    build: function () {
      var byCategory = {};
      var order = [];
      var rows = [];
      var i, s;

      for (i = 0; i < SH.catalog.services.length; i++) {
        s = SH.catalog.services[i];
        if (!byCategory[s.category]) {
          byCategory[s.category] = [];
          order.push(s.category);
        }
        byCategory[s.category].push(serviceCard(s));
      }
      rows.push({ id: 'aviso', kind: 'custom', render: function (node, el) {
        node.appendChild(el('p', 'notice',
          'Atalhos informativos. A disponibilidade de cada serviço nesta TV não foi comprovada.'));
      } });
      for (i = 0; i < order.length; i++) {
        rows.push({ id: 'cat-' + i, title: order[i], kind: 'cards', items: byCategory[order[i]] });
      }
      return rows;
    }
  };

  SH.screens.service = {
    title: 'Atalho',

    build: function (ctx, params) {
      var service = SH.catalog.findService(params.id);
      var status, favorite;
      if (!service) {
        return [{ id: 'erro', kind: 'custom', render: function (node, el) {
          node.appendChild(el('p', 'empty-state', 'Atalho não encontrado.'));
        } }, { id: 'acoes', kind: 'buttons', items: [
          { id: 'voltar', label: 'Voltar', onSelect: function (c) { c.back(); } }
        ] }];
      }
      status = SH.SERVICE_STATUS[service.status];
      favorite = ctx.prefs.isFavorite(service.id);

      return [
        { id: 'info', kind: 'custom', render: function (node, el) {
          var head = el('div', 'detail-head');
          head.appendChild(el('div', 'card-monogram detail-monogram', service.monogram));
          head.appendChild(el('h1', 'detail-title', service.name));
          node.appendChild(head);
          node.appendChild(el('p', 'detail-status', 'Situação: ' + status.label));
          node.appendChild(el('p', 'detail-text', status.detail));
        } },
        { id: 'acoes', kind: 'buttons', items: [
          { id: 'favoritar', label: favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos',
            onSelect: function (c) {
              var added = c.prefs.toggleFavorite(service.id);
              c.toast(added ? service.name + ' adicionado aos favoritos' : service.name + ' removido dos favoritos');
              c.rerender();
            } },
          { id: 'abrir', label: 'Abrir aplicativo',
            onSelect: function (c) {
              c.toast('Abertura de aplicativos não implementada: método não comprovado nesta TV.');
            } },
          { id: 'voltar', label: 'Voltar', onSelect: function (c) { c.back(); } }
        ] }
      ];
    }
  };
})(this);
