/*
 * Adaptador de plataforma: NAVEGADOR (SIMULAÇÃO).
 *
 * Implementa o contrato descrito em docs/ARCHITECTURE.md usando apenas
 * recursos de um navegador de computador. Nada aqui comprova
 * compatibilidade com a TV. O teclado simula o controle remoto:
 *   setas = direcionais · Enter = OK · Backspace/Esc = Return
 */
(function (root) {
  var SH = root.SmartHub;

  SH.platform.createBrowserAdapter = function (win) {
    var w = win || root;

    function safeLocalStorage() {
      try {
        var ls = w.localStorage;
        var probe = '__smarthub_probe__';
        ls.setItem(probe, '1');
        ls.removeItem(probe);
        return ls;
      } catch (e) {
        return null;
      }
    }

    return {
      id: 'browser-simulation',
      name: 'Navegador (simulação)',
      isSimulation: true,

      // Códigos de tecla do teclado do computador.
      keymap: {
        37: 'LEFT', 38: 'UP', 39: 'RIGHT', 40: 'DOWN',
        13: 'ENTER', 8: 'BACK', 27: 'BACK'
      },

      keyHints: { ok: 'Enter', back: 'Backspace / Esc' },

      // Chamado quando o app está pronto. Na TV, aqui ficaria o aviso de
      // "app pronto" exigido pela plataforma (a confirmar).
      ready: function () {},

      storageBackend: safeLocalStorage,

      isOnline: function () {
        return typeof w.navigator === 'undefined' || w.navigator.onLine !== false;
      },

      onConnectivityChange: function (callback) {
        if (w.addEventListener) {
          w.addEventListener('online', function () { callback(true); }, false);
          w.addEventListener('offline', function () { callback(false); }, false);
        }
      },

      getSystemInfo: function () {
        return [
          { label: 'Plataforma', value: 'Navegador de computador (simulação)' },
          { label: 'Resolução da janela', value: w.innerWidth + ' × ' + w.innerHeight },
          { label: 'Agente', value: (w.navigator && w.navigator.userAgent) || 'desconhecido' }
        ];
      },

      // Não há como "sair" de uma aba de navegador; apenas informa.
      exit: function () { return false; }
    };
  };
})(this);
