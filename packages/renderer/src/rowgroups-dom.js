/**
 * DOM enhancer for collapsible table rows (conformance level 2).
 *
 * The renderer deliberately emits every row visible, so a page that never runs
 * this script still shows the whole table — nothing is hidden with no way to
 * get it back. This adds the interactive layer: groups start collapsed, and a
 * parent's toggle shows or hides its subtree.
 *
 * Visibility is derived, never toggled row by row: a row is visible only when
 * every ancestor above it is expanded, so a nested group keeps its own state
 * and stays collapsed when its parent reopens.
 */

const EXPANDED = new WeakMap();

function rowsOf(table) {
  return Array.from(table.querySelectorAll('tr.cm-row'));
}

const depthOf = (row) => Number(row.getAttribute('data-cm-depth') || 0);

function apply(table) {
  const rows = rowsOf(table);
  // Ancestor stack: hidden[d] is true when some row at depth <= d is collapsed.
  const collapsed = [];
  for (const row of rows) {
    const depth = depthOf(row);
    collapsed.length = depth;
    const hidden = collapsed.some(Boolean);
    row.hidden = hidden;

    const toggle = row.querySelector(':scope > td > .cm-row-toggle');
    if (toggle) {
      const expanded = EXPANDED.get(row) === true;
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      collapsed[depth] = !expanded;
    }
  }
}

/**
 * Wire up every row group under `root`.
 *
 * @param {ParentNode} [root] defaults to `document`
 * @returns {number} the number of tables enhanced
 */
export function enhanceRowGroups(root) {
  const scope = root || (typeof document === 'undefined' ? null : document);
  if (!scope || typeof scope.querySelectorAll !== 'function') return 0;

  const tables = Array.from(scope.querySelectorAll('table')).filter(
    (table) => table.querySelector('tr.cm-row-parent') !== null,
  );

  for (const table of tables) {
    if (table.getAttribute('data-cm-rowgroups') === 'ready') continue;
    table.setAttribute('data-cm-rowgroups', 'ready');

    table.addEventListener('click', (event) => {
      const toggle =
        event.target && event.target.closest ? event.target.closest('.cm-row-toggle') : null;
      if (!toggle || !table.contains(toggle)) return;
      const row = toggle.closest('tr.cm-row');
      if (!row) return;
      event.preventDefault();
      EXPANDED.set(row, EXPANDED.get(row) !== true);
      apply(table);
    });

    apply(table);
  }
  return tables.length;
}

export default enhanceRowGroups;
