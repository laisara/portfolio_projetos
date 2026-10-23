/*
 * Preferências do usuário, com validação: qualquer valor salvo que não
 * esteja entre os permitidos é descartado e substituído pelo padrão.
 * Isso evita que dados corrompidos quebrem a interface.
 */
(function (root) {
  var SH = root.SmartHub;
  var STORAGE_KEY = 'preferences';

  var SCHEMA = {
    accent: { values: ['ciano', 'azul'], fallback: 'ciano' },
    textSize: { values: ['normal', 'grande'], fallback: 'normal' },
    animations: { values: [true, false], fallback: true },
    demoMedia: { values: [true, false], fallback: false },
    simulateLibraryError: { values: [true, false], fallback: false }
  };

  // Atalhos favoritos iniciais exibidos na tela Início.
  var DEFAULT_FAVORITES = ['youtube', 'radio', 'navegador'];

  function sanitize(saved) {
    var result = {};
    var key, rule;
    saved = saved && typeof saved === 'object' ? saved : {};
    for (key in SCHEMA) {
      if (Object.prototype.hasOwnProperty.call(SCHEMA, key)) {
        rule = SCHEMA[key];
        result[key] = SH.util.indexOf(rule.values, saved[key]) >= 0 ? saved[key] : rule.fallback;
      }
    }
    result.favorites = sanitizeFavorites(saved.favorites);
    return result;
  }

  function sanitizeFavorites(list) {
    var out = [];
    var i;
    if (!(list instanceof Array)) { return DEFAULT_FAVORITES.slice(0); }
    for (i = 0; i < list.length; i++) {
      if (typeof list[i] === 'string' && SH.util.indexOf(out, list[i]) < 0) {
        out.push(list[i]);
      }
    }
    return out;
  }

  SH.preferenceSchema = SCHEMA;

  SH.createPreferences = function (storage) {
    var current = sanitize(storage.get(STORAGE_KEY, null));

    function save() { storage.set(STORAGE_KEY, current); }

    return {
      get: function (key) { return current[key]; },

      all: function () { return SH.util.extend({}, current); },

      set: function (key, value) {
        var rule = SCHEMA[key];
        if (!rule || SH.util.indexOf(rule.values, value) < 0) {
          throw new Error('Preferência inválida: ' + key);
        }
        current[key] = value;
        save();
      },

      // Avança para o próximo valor permitido (usado pelos itens de opção).
      cycle: function (key) {
        var values = SCHEMA[key].values;
        var next = values[(SH.util.indexOf(values, current[key]) + 1) % values.length];
        this.set(key, next);
        return next;
      },

      isFavorite: function (id) { return SH.util.indexOf(current.favorites, id) >= 0; },

      toggleFavorite: function (id) {
        var idx = SH.util.indexOf(current.favorites, id);
        if (idx >= 0) {
          current.favorites.splice(idx, 1);
        } else {
          current.favorites.push(id);
        }
        save();
        return idx < 0;
      },

      reset: function () {
        current = sanitize(null);
        save();
      }
    };
  };
})(this);
