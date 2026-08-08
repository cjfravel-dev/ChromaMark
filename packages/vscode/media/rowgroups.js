/*
 * Collapsible table row groups for the VS Code Markdown preview. Injected via
 * the `markdown.previewScripts` contribution point.
 *
 * The renderer emits every row visible on purpose, so a preview without this
 * script still shows the whole table. This adds the interactive layer: groups
 * start expanded, matching that static output, and a parent's toggle shows or
 * hides its subtree.
 *
 * Visibility is derived rather than toggled row by row — a row shows only when
 * every ancestor is expanded — so a nested group keeps its own state and stays
 * collapsed when its parent reopens. Rebuilds itself when the preview updates.
 */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  var COLLAPSED = '__cmRowCollapsed';
  var observer;
  var timer;

  function depthOf(row) {
    return Number(row.getAttribute('data-cm-depth') || 0);
  }

  function apply(table) {
    var rows = table.querySelectorAll('tr.cm-row');
    var collapsed = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var depth = depthOf(row);
      collapsed.length = depth;
      var hidden = false;
      for (var d = 0; d < collapsed.length; d++) if (collapsed[d]) hidden = true;
      row.hidden = hidden;

      var toggle = row.querySelector('td > .cm-row-toggle');
      if (toggle) {
        var expanded = row[COLLAPSED] !== true;
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        collapsed[depth] = !expanded;
      }
    }
  }

  function enhance() {
    var tables = document.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      var table = tables[i];
      if (!table.querySelector('tr.cm-row-parent')) continue;
      if (table.getAttribute('data-cm-rowgroups') === 'ready') continue;
      table.setAttribute('data-cm-rowgroups', 'ready');
      bind(table);
      apply(table);
    }
  }

  function bind(table) {
    table.addEventListener('click', function (event) {
      var node = event.target;
      while (node && node !== table && !(node.classList && node.classList.contains('cm-row-toggle'))) {
        node = node.parentNode;
      }
      if (!node || node === table) return;
      var row = node;
      while (row && !(row.classList && row.classList.contains('cm-row'))) row = row.parentNode;
      if (!row) return;
      event.preventDefault();
      row[COLLAPSED] = row[COLLAPSED] !== true;
      apply(table);
    });
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(enhance, 50);
  }

  function start() {
    enhance();
    if (observer || typeof MutationObserver === 'undefined') return;
    observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
