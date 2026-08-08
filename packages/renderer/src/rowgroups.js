/**
 * Collapsible table row groups.
 *
 * A GFM table row whose FIRST cell opens with a run of row markers is a child
 * row: "↳" (U+21B3) or ASCII ">", repeated to nest. Depth is the marker count,
 * and a depth-N row attaches to the nearest preceding row of depth N-1, which
 * becomes the group's toggle.
 *
 * The rule runs before inline parsing so it can strip the marker run from the
 * raw cell text. Tables with no markers are left completely untouched, so plain
 * GFM tables keep their existing output byte for byte.
 *
 * Nothing is hidden in the emitted HTML: collapsing is applied by the optional
 * DOM enhancer (conformance level 2). Without it every row stays visible.
 */

const MARKER_RUN = /^(?:[\u21b3>][ \t]*)+/;

/** Leading marker run of a cell as { depth, rest }, or null when there is none. */
export function parseRowMarkers(text) {
  const match = MARKER_RUN.exec(String(text ?? ''));
  if (!match) return null;
  return {
    depth: (match[0].match(/[\u21b3>]/g) || []).length,
    rest: text.slice(match[0].length),
  };
}

function annotate(state, tokens, rows, parsed) {
  // Clamp depth so a miscounted marker flattens the table instead of dropping a
  // row: a row may only ever be one level deeper than the row above it, and the
  // first row is always depth 0.
  const depths = [];
  let previous = -1;
  parsed.forEach((entry, index) => {
    const depth = previous < 0 ? 0 : Math.min(entry ? entry.depth : 0, previous + 1);
    depths.push(depth);
    previous = depth;
    if (entry && entry.depth > 0 && rows[index].inline !== -1) {
      tokens[rows[index].inline].content = entry.rest;
    }
  });

  for (let index = rows.length - 1; index >= 0; index--) {
    const depth = depths[index];
    const isParent = index + 1 < rows.length && depths[index + 1] > depth;
    let cls = 'cm-row';
    if (isParent) cls += ' cm-row-parent';
    if (depth > 0) cls += ' cm-row-child';

    const tr = tokens[rows[index].tr];
    tr.attrSet('class', cls);
    tr.attrSet('data-cm-depth', String(depth));

    if (isParent && rows[index].inline !== -1) {
      const toggle = new state.Token('cm_row_toggle', '', 0);
      // `hidden` keeps markdown-it's td_open lookahead from inserting a newline
      // before the cell; the custom renderer rule still emits it.
      toggle.hidden = true;
      tokens.splice(rows[index].inline, 0, toggle);
    }
  }
}

export default function rowGroupPlugin(md) {
  md.core.ruler.after('block', 'cm_rowgroups', (state) => {
    const tokens = state.tokens;
    let rows = [];
    let body = false;

    const flush = () => {
      const parsed = rows.map((row) =>
        row.inline === -1 ? null : parseRowMarkers(tokens[row.inline].content),
      );
      if (parsed.some((entry) => entry && entry.depth > 0)) annotate(state, tokens, rows, parsed);
      rows = [];
    };

    for (let i = 0; i < tokens.length; i++) {
      const type = tokens[i].type;
      if (type === 'tbody_open') body = true;
      else if (type === 'tbody_close') {
        body = false;
        flush();
      } else if (type === 'tr_open' && body) {
        let inline = -1;
        for (let j = i + 1; j < tokens.length && tokens[j].type !== 'tr_close'; j++) {
          if (tokens[j].type === 'inline') {
            inline = j;
            break;
          }
        }
        rows.push({ tr: i, inline });
      }
    }
    flush();
    return true;
  });

  md.renderer.rules.cm_row_toggle = () =>
    '<button class="cm-row-toggle" type="button" aria-expanded="false"' +
    ' aria-label="Toggle nested rows"></button>';
}
