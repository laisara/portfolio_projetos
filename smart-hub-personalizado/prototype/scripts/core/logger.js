/*
 * Registro de diagnóstico em memória (buffer circular).
 * Não envia nada para a rede: os registros só são exibidos na tela
 * "Diagnóstico" e, quando existir, no console da plataforma.
 */
(function (root) {
  var SH = root.SmartHub;

  SH.createLogger = function (options) {
    var opts = options || {};
    var limit = opts.limit || 50;
    var now = opts.now || function () { return new Date(); };
    var sink = opts.console || (typeof console !== 'undefined' ? console : null);
    var entries = [];

    function add(level, message) {
      var entry = { level: level, message: String(message), time: now() };
      entries.push(entry);
      if (entries.length > limit) {
        entries.shift();
      }
      if (sink && typeof sink[level] === 'function') {
        try { sink[level]('[SmartHub] ' + entry.message); } catch (e) { /* console indisponível */ }
      }
      return entry;
    }

    return {
      info: function (msg) { return add('info', msg); },
      warn: function (msg) { return add('warn', msg); },
      error: function (msg) { return add('error', msg); },
      entries: function () { return entries.slice(0); },
      clear: function () { entries = []; }
    };
  };
})(this);
