/*
 * Pilha de telas. A base da pilha é sempre uma das abas principais
 * (Início, Entretenimento, ...). Telas de detalhe são empilhadas e o
 * BACK as remove, devolvendo o foco salvo da tela anterior.
 */
(function (root) {
  var SH = root.SmartHub;

  SH.createRouter = function (rootScreenId) {
    var stack = [{ id: rootScreenId, params: {}, focus: null }];

    return {
      current: function () { return stack[stack.length - 1]; },
      depth: function () { return stack.length; },
      canGoBack: function () { return stack.length > 1; },
      rootId: function () { return stack[0].id; },

      push: function (id, params) {
        stack.push({ id: id, params: params || {}, focus: null });
      },

      pop: function () {
        if (stack.length > 1) {
          stack.pop();
          return true;
        }
        return false;
      },

      replaceRoot: function (id, params) {
        stack = [{ id: id, params: params || {}, focus: null }];
      }
    };
  };
})(this);
