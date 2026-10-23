/*
 * Utilitários: relógio, calendário, conectividade e diagnóstico.
 * Todos funcionam sem internet. A data/hora vem do relógio do
 * dispositivo, cuja precisão na TV não foi verificada.
 */
(function (root) {
  var SH = root.SmartHub;

  function backButton() {
    return { id: 'voltar', label: 'Voltar', onSelect: function (c) { c.back(); } };
  }

  SH.screens.utilities = {
    title: 'Utilitários',
    tab: true,

    build: function () {
      return [
        { id: 'ferramentas', title: 'Ferramentas', kind: 'cards', items: [
          { id: 'util-clock', label: 'Relógio', monogram: 'RL', onSelect: function (c) { c.open('clock'); } },
          { id: 'util-calendar', label: 'Calendário', monogram: 'CL', onSelect: function (c) { c.open('calendar'); } },
          { id: 'util-conn', label: 'Conectividade', monogram: 'NET', onSelect: function (c) { c.open('connectivity'); } },
          { id: 'util-diag', label: 'Diagnóstico', monogram: 'DG', onSelect: function (c) { c.open('diagnostics'); } }
        ] }
      ];
    }
  };

  SH.screens.clock = {
    title: 'Relógio',
    // Pede ao app para redesenhar a cada segundo enquanto visível.
    tickMs: 1000,

    build: function (ctx) {
      var now = ctx.now();
      return [
        { id: 'relogio', kind: 'custom', render: function (node, el) {
          node.appendChild(el('div', 'big-clock', SH.clock.formatTime(now, true)));
          node.appendChild(el('div', 'big-date', SH.clock.formatDate(now)));
        } },
        { id: 'acoes', kind: 'buttons', items: [backButton()] }
      ];
    }
  };

  SH.screens.calendar = {
    title: 'Calendário',

    build: function (ctx, params) {
      var today = ctx.now();
      var year = params.year !== undefined ? params.year : today.getFullYear();
      var month = params.month !== undefined ? params.month : today.getMonth();

      function shift(delta) {
        return function (c) {
          var next = SH.clock.shiftMonth(year, month, delta);
          params.year = next.year;
          params.month = next.month;
          c.rerender();
        };
      }

      return [
        { id: 'mes', kind: 'custom', render: function (node, el) {
          var weeks = SH.clock.buildMonthMatrix(year, month);
          var table = el('table', 'calendar');
          var tr = el('tr');
          var w, d, day, cell, isToday;
          node.appendChild(el('h1', 'detail-title', SH.clock.formatMonthTitle(year, month)));
          for (d = 0; d < 7; d++) { tr.appendChild(el('th', null, SH.clock.WEEKDAYS_SHORT[d])); }
          table.appendChild(tr);
          for (w = 0; w < weeks.length; w++) {
            tr = el('tr');
            for (d = 0; d < 7; d++) {
              day = weeks[w][d];
              isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              cell = el('td', isToday ? 'is-today' : null, day === null ? '' : day);
              tr.appendChild(cell);
            }
            table.appendChild(tr);
          }
          node.appendChild(table);
        } },
        { id: 'acoes', kind: 'buttons', items: [
          { id: 'mes-anterior', label: 'Mês anterior', onSelect: shift(-1) },
          { id: 'mes-seguinte', label: 'Próximo mês', onSelect: shift(1) },
          backButton()
        ] }
      ];
    }
  };

  SH.screens.connectivity = {
    title: 'Conectividade',

    build: function (ctx) {
      var online = ctx.isOnline();
      return [
        { id: 'estado', kind: 'custom', render: function (node, el) {
          node.appendChild(el('h1', 'detail-title', online ? 'Conectado' : 'Sem conexão'));
          node.appendChild(el('p', 'detail-text', online ?
            'A plataforma informa que há conexão de rede. Isso não garante acesso à internet.' :
            'O Smart Hub continua funcionando: relógio, calendário e configurações não usam a rede.'));
          node.appendChild(el('p', 'detail-text', 'Fonte da informação: ' + ctx.adapter.name + '.'));
        } },
        { id: 'acoes', kind: 'buttons', items: [backButton()] }
      ];
    }
  };

  SH.screens.diagnostics = {
    title: 'Diagnóstico',

    build: function (ctx) {
      var info = ctx.adapter.getSystemInfo();
      var entries = ctx.logger.entries();
      return [
        { id: 'sistema', kind: 'custom', render: function (node, el) {
          var list = el('dl', 'info-list');
          var i;
          node.appendChild(el('h1', 'detail-title', 'Diagnóstico'));
          info.push({ label: 'Armazenamento', value: ctx.storageIsPersistent() ? 'Persistente' : 'Somente memória (não persistente)' });
          for (i = 0; i < info.length; i++) {
            list.appendChild(el('dt', null, info[i].label));
            list.appendChild(el('dd', null, info[i].value));
          }
          node.appendChild(list);
        } },
        { id: 'registros', title: 'Registros recentes', kind: 'custom', render: function (node, el) {
          var list = el('ol', 'log-list');
          var i, e;
          if (!entries.length) {
            node.appendChild(el('p', 'empty-state', 'Nenhum registro.'));
            return;
          }
          for (i = entries.length - 1; i >= 0 && i >= entries.length - 8; i--) {
            e = entries[i];
            list.appendChild(el('li', 'log-' + e.level,
              SH.clock.formatTime(e.time, true) + ' [' + e.level + '] ' + e.message));
          }
          node.appendChild(list);
        } },
        { id: 'acoes', kind: 'buttons', items: [
          { id: 'limpar-log', label: 'Limpar registros', onSelect: function (c) { c.logger.clear(); c.rerender(); } },
          backButton()
        ] }
      ];
    }
  };
})(this);
