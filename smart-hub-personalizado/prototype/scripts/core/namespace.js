/*
 * Namespace global do Smart Hub.
 *
 * Todo o código do protótipo é escrito em ECMAScript 5 (sem let/const,
 * arrow functions, classes, módulos ES ou Promise), porque o nível de
 * JavaScript da plataforma legada da TV ainda não foi confirmado
 * (ver docs/PLATFORM_COMPATIBILITY.md). Os arquivos são carregados por
 * <script> em ordem e registram-se em window.SmartHub.
 *
 * O padrão (function (root) { ... })(this) permite carregar os mesmos
 * arquivos no Node (vm) para os testes unitários.
 */
(function (root) {
  var SH = root.SmartHub = root.SmartHub || {};

  SH.version = '0.1.0';
  SH.screens = SH.screens || {};
  SH.platform = SH.platform || {};

  SH.util = {
    clamp: function (value, min, max) {
      if (value < min) { return min; }
      if (value > max) { return max; }
      return value;
    },

    // Cópia rasa: suficiente para objetos de preferências planos.
    extend: function (target) {
      var i, key, source;
      for (i = 1; i < arguments.length; i++) {
        source = arguments[i];
        if (!source) { continue; }
        for (key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    },

    indexOf: function (list, value) {
      var i;
      for (i = 0; i < list.length; i++) {
        if (list[i] === value) { return i; }
      }
      return -1;
    },

    pad2: function (n) {
      return n < 10 ? '0' + n : String(n);
    }
  };
})(this);
