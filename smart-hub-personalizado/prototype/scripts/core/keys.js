/*
 * Tradução de teclas físicas em ações lógicas.
 *
 * O núcleo da interface só conhece ações (UP, DOWN, LEFT, RIGHT, ENTER,
 * BACK). Os códigos numéricos das teclas vêm do adaptador de plataforma:
 * no protótipo, o teclado do computador; na TV, os códigos reais deverão
 * ser obtidos da própria plataforma e confirmados em hardware.
 */
(function (root) {
  var SH = root.SmartHub;

  SH.ACTIONS = {
    UP: 'UP', DOWN: 'DOWN', LEFT: 'LEFT', RIGHT: 'RIGHT',
    ENTER: 'ENTER', BACK: 'BACK'
  };

  SH.createKeyMapper = function (keymap) {
    return {
      actionFor: function (keyCode) {
        return Object.prototype.hasOwnProperty.call(keymap, keyCode) ? keymap[keyCode] : null;
      }
    };
  };

  /*
   * Controle de repetição ao segurar uma tecla.
   * - Setas: a primeira pressão passa imediatamente; enquanto a tecla
   *   continua pressionada, só uma repetição a cada `intervalMs`
   *   (evita "atropelar" a interface em hardware lento).
   * - ENTER/BACK: repetições são ignoradas, para não ativar um item
   *   várias vezes nem voltar várias telas por acidente.
   * Não depende de KeyboardEvent.repeat, que pode não existir em
   * navegadores antigos: a repetição é detectada por keydown sem keyup.
   */
  SH.createRepeatGuard = function (intervalMs, nowFn) {
    var now = nowFn || function () { return new Date().getTime(); };
    var held = {};
    var lastAccepted = {};

    return {
      keyDown: function (action) {
        var t = now();
        var isRepeat = held[action] === true;
        held[action] = true;
        if (!isRepeat) {
          lastAccepted[action] = t;
          return true;
        }
        if (action === SH.ACTIONS.ENTER || action === SH.ACTIONS.BACK) {
          return false;
        }
        if (t - lastAccepted[action] >= intervalMs) {
          lastAccepted[action] = t;
          return true;
        }
        return false;
      },
      keyUp: function (action) {
        held[action] = false;
      }
    };
  };
})(this);
