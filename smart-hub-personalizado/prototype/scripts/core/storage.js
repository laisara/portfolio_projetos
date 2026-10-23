/*
 * Armazenamento chave/valor com serialização JSON.
 *
 * O backend é fornecido pelo adaptador de plataforma (no navegador,
 * window.localStorage). Se o backend estiver ausente ou falhar (modo
 * privado, cota excedida, API inexistente na TV), os dados passam a
 * ficar só em memória e o problema é registrado no logger: a interface
 * continua funcionando, apenas sem persistência.
 */
(function (root) {
  var SH = root.SmartHub;

  function createMemoryBackend() {
    var data = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
      setItem: function (k, v) { data[k] = String(v); },
      removeItem: function (k) { delete data[k]; }
    };
  }

  SH.createMemoryBackend = createMemoryBackend;

  SH.createStorage = function (backend, namespace, logger) {
    var prefix = (namespace || 'smarthub') + ':';
    var active = backend || createMemoryBackend();
    var persistent = !!backend;

    function fallBack(err) {
      if (logger) { logger.warn('Armazenamento indisponível, usando memória: ' + (err && err.message)); }
      active = createMemoryBackend();
      persistent = false;
    }

    return {
      get: function (key, defaultValue) {
        var raw;
        try {
          raw = active.getItem(prefix + key);
        } catch (err) {
          fallBack(err);
          return defaultValue;
        }
        if (raw === null || raw === undefined) { return defaultValue; }
        try {
          return JSON.parse(raw);
        } catch (parseErr) {
          if (logger) { logger.warn('Valor corrompido em "' + key + '", usando padrão.'); }
          return defaultValue;
        }
      },

      set: function (key, value) {
        var raw = JSON.stringify(value);
        try {
          active.setItem(prefix + key, raw);
        } catch (err) {
          fallBack(err);
          active.setItem(prefix + key, raw);
        }
      },

      remove: function (key) {
        try { active.removeItem(prefix + key); } catch (err) { fallBack(err); }
      },

      isPersistent: function () { return persistent; }
    };
  };
})(this);
