/*
 * RASCUNHO — Adaptador para a plataforma legada Samsung ("Orsay", 2011–2015).
 *
 * ESTADO: NÃO TESTADO. NÃO É CARREGADO PELO PROTÓTIPO.
 *
 * Os nomes de objetos usados abaixo (Common.API.Widget,
 * Common.API.TVKeyValue, Common.API.Plugin) vêm de conhecimento prévio da
 * documentação legada da Samsung e NÃO puderam ser conferidos nesta
 * investigação (developer.samsung.com estava inacessível; ver
 * research/SOURCES.md). Por isso:
 *   - toda chamada é protegida por detecção de recurso;
 *   - nenhum código numérico de tecla é fixado aqui: os códigos são lidos
 *     da própria plataforma em tempo de execução;
 *   - se algo não existir, o adaptador degrada para o comportamento do
 *     navegador e registra o motivo.
 * Antes de usar: confirmar cada item na documentação oficial arquivada e
 * no aparelho, e atualizar docs/PLATFORM_COMPATIBILITY.md.
 */
(function (root) {
  var SH = root.SmartHub;

  function has(path) {
    var parts = path.split('.');
    var node = root;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (node === null || node === undefined || !(parts[i] in node)) { return false; }
      node = node[parts[i]];
    }
    return true;
  }

  SH.platform.createOrsayAdapterDraft = function () {
    var base = SH.platform.createBrowserAdapter(root);
    var notes = [];
    var widget = null;
    var keyValues = null;
    var keymap = {};

    if (has('Common.API.Widget')) {
      widget = new root.Common.API.Widget();
    } else {
      notes.push('Common.API.Widget ausente');
    }

    if (has('Common.API.TVKeyValue')) {
      keyValues = new root.Common.API.TVKeyValue();
      // Constrói o mapa a partir das constantes da plataforma, se existirem.
      var wanted = { KEY_LEFT: 'LEFT', KEY_RIGHT: 'RIGHT', KEY_UP: 'UP', KEY_DOWN: 'DOWN',
        KEY_ENTER: 'ENTER', KEY_RETURN: 'BACK' };
      var name;
      for (name in wanted) {
        if (Object.prototype.hasOwnProperty.call(wanted, name) && typeof keyValues[name] === 'number') {
          keymap[keyValues[name]] = wanted[name];
        } else if (Object.prototype.hasOwnProperty.call(wanted, name)) {
          notes.push('Constante de tecla ausente: ' + name);
        }
      }
    } else {
      notes.push('Common.API.TVKeyValue ausente: usando mapa do navegador');
      keymap = base.keymap;
    }

    return {
      id: 'samsung-orsay-draft',
      name: 'Samsung legada (rascunho não verificado)',
      isSimulation: false,
      keymap: keymap,
      keyHints: { ok: 'OK', back: 'Return' },
      notes: notes,

      ready: function () {
        // Hipótese: a plataforma exige um aviso de "app pronto".
        if (widget && typeof widget.sendReadyEvent === 'function') { widget.sendReadyEvent(); }
      },

      // localStorage pode não existir na plataforma; nesse caso, o núcleo
      // usa memória (sem persistência) e registra o aviso.
      storageBackend: base.storageBackend,
      isOnline: base.isOnline,
      onConnectivityChange: base.onConnectivityChange,

      getSystemInfo: function () {
        var info = base.getSystemInfo();
        info[0] = { label: 'Plataforma', value: 'Samsung legada (adaptador em rascunho)' };
        info.push({ label: 'Observações do adaptador', value: notes.length ? notes.join('; ') : 'nenhuma' });
        return info;
      },

      exit: function () {
        // Hipótese: sendReturnEvent devolve o controle ao Smart Hub.
        if (widget && typeof widget.sendReturnEvent === 'function') {
          widget.sendReturnEvent();
          return true;
        }
        return false;
      }
    };
  };
})(this);
