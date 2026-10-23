/*
 * Modelo de foco em linhas (sem DOM).
 *
 * A tela é descrita como uma lista de linhas; cada linha tem N itens
 * focáveis. Regras de navegação, escolhidas para serem previsíveis com
 * controle remoto:
 * - Esquerda/direita: move dentro da linha, sem dar a volta (para no fim).
 * - Cima/baixo: vai para a linha focável anterior/seguinte, pulando
 *   linhas vazias. Cada linha lembra a última coluna visitada; se a
 *   linha nunca foi visitada, usa a coluna atual limitada ao tamanho.
 * - Uma linha pode ter "âncora": ao entrar nela, o foco vai sempre para
 *   a coluna ancorada (ex.: barra de abas -> aba ativa). Como a coluna
 *   de uma linha ancorada não se alinha com as outras, ao sair dela a
 *   linha de destino usa a coluna lembrada ou a primeira.
 * - O foco nunca fica em posição inválida: se as linhas mudarem, ele é
 *   reposicionado no item válido mais próximo.
 */
(function (root) {
  var SH = root.SmartHub;
  var clamp = SH.util.clamp;

  SH.createFocusModel = function (rowLengths, rowAnchors) {
    var lengths = [];
    var anchors = [];
    var memory = [];
    var row = -1;
    var col = 0;

    function isFocusable(r) { return r >= 0 && r < lengths.length && lengths[r] > 0; }

    function firstFocusableRow() {
      var r;
      for (r = 0; r < lengths.length; r++) {
        if (isFocusable(r)) { return r; }
      }
      return -1;
    }

    function nearestFocusableRow(start) {
      var d;
      for (d = 0; d < lengths.length; d++) {
        if (isFocusable(start + d)) { return start + d; }
        if (isFocusable(start - d)) { return start - d; }
      }
      return -1;
    }

    function setRows(newLengths, newAnchors) {
      lengths = newLengths.slice(0);
      anchors = newAnchors ? newAnchors.slice(0) : [];
      memory = [];
      if (!isFocusable(row)) {
        row = row < 0 ? firstFocusableRow() : nearestFocusableRow(row);
      }
      col = row < 0 ? 0 : clamp(col, 0, lengths[row] - 1);
    }

    function hasAnchor(r) { return anchors[r] !== undefined && anchors[r] !== null; }

    function enterRow(target) {
      var fallback = hasAnchor(row) ? 0 : col;
      var preferred = hasAnchor(target) ? anchors[target] : memory[target];
      memory[row] = col;
      row = target;
      col = clamp(preferred !== undefined ? preferred : fallback, 0, lengths[row] - 1);
    }

    function move(action) {
      var r;
      if (row < 0) { return false; }
      if (action === 'LEFT') {
        if (col > 0) { col--; return true; }
        return false;
      }
      if (action === 'RIGHT') {
        if (col < lengths[row] - 1) { col++; return true; }
        return false;
      }
      if (action === 'UP') {
        for (r = row - 1; r >= 0; r--) {
          if (isFocusable(r)) { enterRow(r); return true; }
        }
        return false;
      }
      if (action === 'DOWN') {
        for (r = row + 1; r < lengths.length; r++) {
          if (isFocusable(r)) { enterRow(r); return true; }
        }
        return false;
      }
      return false;
    }

    setRows(rowLengths || [], rowAnchors);

    return {
      setRows: setRows,
      move: move,
      get: function () { return { row: row, col: col }; },
      set: function (r, c) {
        if (!isFocusable(r)) { return false; }
        row = r;
        col = clamp(c, 0, lengths[r] - 1);
        return true;
      },
      getState: function () { return { row: row, col: col, memory: memory.slice(0) }; },
      restore: function (state) {
        if (!state) { return; }
        memory = state.memory ? state.memory.slice(0) : [];
        if (!this.set(state.row, state.col)) {
          row = nearestFocusableRow(clamp(state.row, 0, Math.max(lengths.length - 1, 0)));
          col = row < 0 ? 0 : clamp(state.col, 0, lengths[row] - 1);
        }
      }
    };
  };
})(this);
