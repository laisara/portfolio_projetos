/*
 * Inicialização e laço principal do Smart Hub.
 *
 * Liga os módulos: adaptador de plataforma -> teclas -> modelo de foco ->
 * roteador -> telas -> renderização. A interface trabalha em uma "tela"
 * lógica fixa de 1280x720 que é escalada para caber na janela.
 */
(function (root) {
  var SH = root.SmartHub;
  var STAGE_W = 1280;
  var STAGE_H = 720;
  var REPEAT_INTERVAL_MS = 150;
  var EXIT_CONFIRM_MS = 2500;

  var TABS = [
    { id: 'home', label: 'Início' },
    { id: 'entertainment', label: 'Entretenimento' },
    { id: 'library', label: 'Minha biblioteca' },
    { id: 'utilities', label: 'Utilitários' },
    { id: 'settings', label: 'Configurações' }
  ];

  SH.startApp = function (adapter, doc) {
    var d = doc || root.document;
    var logger = SH.createLogger();
    var storage = SH.createStorage(adapter.storageBackend(), 'smarthub', logger);
    var prefs = SH.createPreferences(storage);
    var keys = SH.createKeyMapper(adapter.keymap);
    var repeatGuard = SH.createRepeatGuard(REPEAT_INTERVAL_MS);
    var router = SH.createRouter('home');
    var focus = SH.createFocusModel([]);
    var online = adapter.isOnline();
    var rows = [];
    var grid = [];
    var lastExitPress = 0;
    var toastTimer = null;
    var screenTimer = null;

    var nodes = {
      stage: d.getElementById('stage'),
      content: d.getElementById('content'),
      title: d.getElementById('screen-title'),
      time: d.getElementById('header-time'),
      date: d.getElementById('header-date'),
      network: d.getElementById('header-network'),
      simulation: d.getElementById('simulation-badge'),
      hints: d.getElementById('key-hints'),
      toast: d.getElementById('toast')
    };

    var ctx = {
      adapter: adapter,
      prefs: prefs,
      logger: logger,
      now: function () { return new Date(); },
      isOnline: function () { return online; },
      storageIsPersistent: function () { return storage.isPersistent(); },
      libraryProvider: function () {
        if (prefs.get('simulateLibraryError')) { return SH.createLibraryProvider('error'); }
        return SH.createLibraryProvider(prefs.get('demoMedia') ? 'demo' : 'empty');
      },
      open: function (screenId, params) {
        router.current().focus = focus.getState();
        router.push(screenId, params);
        render(null);
      },
      back: function () { goBack(); },
      goToTab: function (tabId) { goToTab(tabId, false); },
      rerender: function () { render(focus.getState()); },
      toast: showToast,
      applyPreferences: applyPreferences
    };

    function currentScreen() {
      var screen = SH.screens[router.current().id];
      if (!screen) { throw new Error('Tela inexistente: ' + router.current().id); }
      return screen;
    }

    function navRow() {
      var items = [];
      var i;
      for (i = 0; i < TABS.length; i++) {
        items.push({ id: 'tab-' + TABS[i].id, label: TABS[i].label, active: TABS[i].id === router.rootId(),
          onSelect: selectTab(TABS[i].id) });
      }
      return { id: 'nav', kind: 'nav', items: items, anchor: activeTabIndex() };
    }

    function selectTab(tabId) {
      return function () { goToTab(tabId, true); };
    }

    function activeTabIndex() {
      var i;
      for (i = 0; i < TABS.length; i++) {
        if (TABS[i].id === router.rootId()) { return i; }
      }
      return 0;
    }

    function goToTab(tabId, keepFocusOnNav) {
      router.replaceRoot(tabId);
      // Linha 0 é a barra de abas; linha 1 é o primeiro conteúdo.
      render(keepFocusOnNav ? { row: 0, col: activeTabIndex() } : { row: 1, col: 0 });
    }

    /*
     * Redesenha a tela atual. `focusState` define onde o foco fica:
     * null = foco salvo na entrada do roteador ou primeiro item.
     */
    function render(focusState) {
      var screen, entry, lengths, anchors, i;
      try {
        screen = currentScreen();
        entry = router.current();
        rows = screen.build(ctx, entry.params);
        if (screen.tab) { rows.unshift(navRow()); }
      } catch (err) {
        logger.error('Falha ao montar a tela: ' + err.message);
        rows = [{ id: 'erro', kind: 'custom', render: function (node, el) {
          node.appendChild(el('p', 'error-state', 'Ocorreu um erro ao exibir esta tela. Pressione Voltar.'));
        } }];
        screen = { title: 'Erro' };
      }

      nodes.title.innerHTML = '';
      nodes.title.appendChild(d.createTextNode(screen.title));
      grid = SH.renderRows(nodes.content, rows);
      lengths = [];
      anchors = [];
      for (i = 0; i < grid.length; i++) {
        lengths.push(grid[i].length);
        anchors.push(rows[i].anchor);
      }
      focus.setRows(lengths, anchors);

      if (focusState) {
        focus.restore(focusState);
      } else if (entry && entry.focus) {
        focus.restore(entry.focus);
      } else {
        // Telas de abas começam no primeiro conteúdo, não na barra de abas.
        focus.restore({ row: screen.tab && lengths.length > 1 ? 1 : 0, col: 0 });
      }
      nodes.content.scrollTop = 0;
      SH.applyFocus(grid, nodes.content, null, focus.get());
      scheduleScreenTick(screen);
    }

    function scheduleScreenTick(screen) {
      if (screenTimer) { root.clearInterval(screenTimer); screenTimer = null; }
      if (screen.tickMs) {
        screenTimer = root.setInterval(function () { render(focus.getState()); }, screen.tickMs);
      }
    }

    function moveFocus(action) {
      var before = focus.get();
      if (focus.move(action)) {
        SH.applyFocus(grid, nodes.content, before, focus.get());
      }
    }

    function activate() {
      var pos = focus.get();
      var item;
      if (pos.row < 0) { return; }
      item = rows[pos.row].items[pos.col];
      if (!item || !item.onSelect) { return; }
      try {
        item.onSelect(ctx);
      } catch (err) {
        logger.error('Erro ao executar "' + item.label + '": ' + err.message);
        showToast('Não foi possível concluir a ação.');
      }
    }

    function goBack() {
      var now = new Date().getTime();
      if (router.canGoBack()) {
        router.pop();
        render(null);
        return;
      }
      if (router.rootId() !== 'home') {
        goToTab('home', true);
        return;
      }
      if (now - lastExitPress < EXIT_CONFIRM_MS) {
        if (!adapter.exit()) {
          showToast('Sair não está disponível na simulação.');
        }
        lastExitPress = 0;
        return;
      }
      lastExitPress = now;
      showToast('Pressione Voltar novamente para sair.');
    }

    function onKeyDown(event) {
      var e = event || root.event;
      var action = keys.actionFor(e.keyCode);
      if (!action) { return; }
      if (e.preventDefault) { e.preventDefault(); }
      if (!repeatGuard.keyDown(action)) { return; }
      if (action === 'ENTER') {
        activate();
      } else if (action === 'BACK') {
        goBack();
      } else {
        moveFocus(action);
      }
    }

    function onKeyUp(event) {
      var e = event || root.event;
      var action = keys.actionFor(e.keyCode);
      if (action) { repeatGuard.keyUp(action); }
    }

    function showToast(message) {
      nodes.toast.innerHTML = '';
      nodes.toast.appendChild(d.createTextNode(message));
      SH.dom.addClass(nodes.toast, 'is-visible');
      if (toastTimer) { root.clearTimeout(toastTimer); }
      toastTimer = root.setTimeout(function () { SH.dom.removeClass(nodes.toast, 'is-visible'); }, 3000);
    }

    function applyPreferences() {
      var classes = ['accent-' + prefs.get('accent'), 'text-' + prefs.get('textSize'),
        prefs.get('animations') ? 'anim-on' : 'anim-off'];
      if (adapter.isSimulation) { classes.push('is-simulation'); }
      d.body.className = classes.join(' ');
    }

    function updateHeader() {
      var now = new Date();
      var time = SH.clock.formatTime(now);
      var date = SH.clock.formatDate(now);
      if (nodes.time.innerHTML !== time) { nodes.time.innerHTML = time; }
      if (nodes.date.innerHTML !== date) { nodes.date.innerHTML = date; }
      nodes.network.className = 'network ' + (online ? 'is-online' : 'is-offline');
      nodes.network.innerHTML = online ? 'Conectado' : 'Sem conexão';
    }

    // Escala a tela lógica 1280x720 para a janela, mantendo a proporção.
    function fitStage() {
      var w = root.innerWidth || STAGE_W;
      var h = root.innerHeight || STAGE_H;
      var scale = Math.min(w / STAGE_W, h / STAGE_H);
      var t = 'scale(' + scale + ')';
      nodes.stage.style.webkitTransform = t;
      nodes.stage.style.transform = t;
      nodes.stage.style.left = Math.round((w - STAGE_W * scale) / 2) + 'px';
      nodes.stage.style.top = Math.round((h - STAGE_H * scale) / 2) + 'px';
    }

    root.onerror = function (message) {
      logger.error('Erro não tratado: ' + message);
    };

    nodes.simulation.style.display = adapter.isSimulation ? '' : 'none';
    nodes.hints.innerHTML = '';
    nodes.hints.appendChild(d.createTextNode('Setas: navegar · ' + adapter.keyHints.ok + ': selecionar · ' +
      adapter.keyHints.back + ': voltar'));

    applyPreferences();
    d.addEventListener('keydown', onKeyDown, false);
    d.addEventListener('keyup', onKeyUp, false);
    root.addEventListener('resize', fitStage, false);
    adapter.onConnectivityChange(function (isOnline) {
      online = isOnline;
      logger.info(isOnline ? 'Conexão restabelecida.' : 'Conexão perdida.');
      updateHeader();
      render(focus.getState());
    });

    fitStage();
    updateHeader();
    root.setInterval(updateHeader, 1000);
    render(null);
    logger.info('Smart Hub ' + SH.version + ' iniciado em: ' + adapter.name);
    if (!storage.isPersistent()) { logger.warn('Preferências não serão mantidas após recarregar.'); }
    adapter.ready();

    SH.app = {
      currentScreenId: function () { return router.current().id; },
      focus: function () { return focus.get(); },
      focusedItemId: function () {
        var pos = focus.get();
        return pos.row < 0 ? null : rows[pos.row].items[pos.col].id;
      }
    };
    return SH.app;
  };
})(this);
