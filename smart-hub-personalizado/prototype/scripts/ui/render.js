/*
 * Renderização de telas a partir de descritores de linha.
 *
 * Uma tela é uma lista de linhas:
 *   { id, title, kind, items: [...], render: function (container) }
 * kind: 'nav' | 'hero' | 'cards' | 'options' | 'buttons' | 'custom'
 * Linhas 'custom' desenham conteúdo próprio e não recebem foco.
 *
 * Usa apenas APIs de DOM antigas (createElement, className, appendChild)
 * para reduzir o risco de incompatibilidade com o navegador da TV.
 */
(function (root) {
  var SH = root.SmartHub;

  function el(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) {
      node.appendChild(root.document.createTextNode(String(text)));
    }
    return node;
  }

  function hasClass(node, name) {
    return (' ' + node.className + ' ').indexOf(' ' + name + ' ') >= 0;
  }

  function addClass(node, name) {
    if (!hasClass(node, name)) { node.className = node.className ? node.className + ' ' + name : name; }
  }

  function removeClass(node, name) {
    node.className = (' ' + node.className + ' ').replace(' ' + name + ' ', ' ')
      .replace(/^\s+|\s+$/g, '');
  }

  function renderItem(row, item) {
    var node;
    if (row.kind === 'nav') {
      node = el('div', 'nav-tab' + (item.active ? ' is-active' : ''), item.label);
    } else if (row.kind === 'hero') {
      node = el('div', 'hero');
      node.appendChild(el('div', 'hero-kicker', item.kicker || 'Destaque'));
      node.appendChild(el('div', 'hero-title', item.label));
      node.appendChild(el('div', 'hero-text', item.sub));
    } else if (row.kind === 'options') {
      node = el('div', 'option');
      node.appendChild(el('span', 'option-label', item.label));
      node.appendChild(el('span', 'option-value', item.value));
    } else if (row.kind === 'buttons') {
      node = el('div', 'button', item.label);
    } else {
      node = el('div', 'card' + (item.wide ? ' card-wide' : ''));
      if (item.monogram) { node.appendChild(el('div', 'card-monogram', item.monogram)); }
      node.appendChild(el('div', 'card-label', item.label));
      if (item.sub) { node.appendChild(el('div', 'card-sub', item.sub)); }
      if (item.badge) { node.appendChild(el('div', 'card-badge', item.badge)); }
    }
    node.setAttribute('data-item-id', item.id);
    return node;
  }

  /*
   * Desenha as linhas dentro de `container` e devolve a grade de
   * elementos focáveis, na mesma ordem das linhas (linhas sem foco
   * aparecem como arrays vazios, para alinhar com o modelo de foco).
   */
  SH.renderRows = function (container, rows) {
    var grid = [];
    var r, i, row, rowNode, track, items;

    while (container.firstChild) { container.removeChild(container.firstChild); }

    for (r = 0; r < rows.length; r++) {
      row = rows[r];
      rowNode = el('section', 'row row-' + row.kind);
      rowNode.setAttribute('data-row-id', row.id);
      if (row.title) { rowNode.appendChild(el('h2', 'row-title', row.title)); }

      items = [];
      if (row.kind === 'custom') {
        if (row.render) { row.render(rowNode, el); }
      } else {
        track = el('div', 'row-track');
        for (i = 0; i < row.items.length; i++) {
          items.push(track.appendChild(renderItem(row, row.items[i])));
        }
        rowNode.appendChild(track);
      }
      container.appendChild(rowNode);
      grid.push(items);
    }
    return grid;
  };

  /*
   * Aplica a classe de foco e rola o conteúdo para manter o item visível.
   * A rolagem é feita por scrollTop/scrollLeft em contêineres com
   * overflow oculto, em vez de scrollIntoView com opções modernas.
   */
  SH.applyFocus = function (grid, scroller, previous, next) {
    var node, track, rowNode;
    if (previous && grid[previous.row] && grid[previous.row][previous.col]) {
      removeClass(grid[previous.row][previous.col], 'is-focused');
    }
    if (!next || next.row < 0) { return null; }
    node = grid[next.row][next.col];
    if (!node) { return null; }
    addClass(node, 'is-focused');

    track = node.parentNode;
    if (track.scrollWidth > track.clientWidth) {
      if (node.offsetLeft + node.offsetWidth > track.scrollLeft + track.clientWidth) {
        track.scrollLeft = node.offsetLeft + node.offsetWidth - track.clientWidth + 24;
      } else if (node.offsetLeft < track.scrollLeft) {
        track.scrollLeft = Math.max(node.offsetLeft - 24, 0);
      }
    }

    rowNode = track.parentNode;
    if (scroller) {
      if (rowNode.offsetTop + rowNode.offsetHeight > scroller.scrollTop + scroller.clientHeight) {
        scroller.scrollTop = rowNode.offsetTop + rowNode.offsetHeight - scroller.clientHeight;
      } else if (rowNode.offsetTop < scroller.scrollTop) {
        scroller.scrollTop = rowNode.offsetTop;
      }
    }
    return node;
  };

  SH.dom = { el: el, addClass: addClass, removeClass: removeClass, hasClass: hasClass };
})(this);
