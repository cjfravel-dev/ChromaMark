/**
 * Block-level ChromaMark containers, fenced with three or more colons:
 *   ::: <tone|block> [color=…] [title]   → colored callout
 *   ::: details [open] [tone] <summary>  → collapsible section
 *   ::: fields                            → key/value definition list
 *
 * Nesting uses more colons on the outer fence. The find-closing algorithm is
 * adapted from markdown-it-container.
 */

import { resolveTone, parseSpec } from './tones.js';

const MARKER = 0x3a; // :
const MIN_FENCE = 3;

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function parseOpener(info) {
  if (!info) return null;
  const tokens = info.split(/\s+/);
  const kind = tokens.shift().toLowerCase();

  let structure;
  let tone = null;
  let color = null;
  let open = false;

  if (kind === 'details') {
    structure = 'details';
  } else if (kind === 'fields') {
    return { structure: 'fields' };
  } else if (kind === 'block') {
    structure = 'callout';
  } else {
    const t = resolveTone(kind);
    if (!t) return null;
    structure = 'callout';
    tone = t;
  }

  while (tokens.length) {
    const tk = tokens[0];
    const low = tk.toLowerCase();
    if (structure === 'details' && low === 'open') {
      open = true;
      tokens.shift();
      continue;
    }
    if (low.startsWith('color=')) {
      const spec = parseSpec(tk);
      if (spec && spec.color) {
        color = spec.color;
        tokens.shift();
        continue;
      }
      break;
    }
    if (structure === 'details' && tone === null && resolveTone(tk)) {
      tone = resolveTone(tk);
      tokens.shift();
      continue;
    }
    break;
  }

  const rest = tokens.join(' ').trim();
  if (structure === 'details') {
    return { structure, tone, color, open, summary: rest || 'Details' };
  }
  return { structure, tone, color, title: rest || (tone ? cap(tone) : '') };
}

function fenceLength(src, pos, max) {
  let count = 0;
  let p = pos;
  while (p < max && src.charCodeAt(p) === MARKER) {
    count++;
    p++;
  }
  return count;
}

function makeRule(enabled) {
  return function chromaContainer(state, startLine, endLine, silent) {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    if (state.src.charCodeAt(start) !== MARKER) return false;

    const openLen = fenceLength(state.src, start, max);
    if (openLen < MIN_FENCE) return false;

    const parsed = parseOpener(state.src.slice(start + openLen, max).trim());
    if (!parsed || !enabled[parsed.structure]) return false;
    if (silent) return true;

    let nextLine = startLine;
    let autoClosed = false;
    for (;;) {
      nextLine++;
      if (nextLine >= endLine) break;
      const lstart = state.bMarks[nextLine] + state.tShift[nextLine];
      const lmax = state.eMarks[nextLine];
      if (state.src.charCodeAt(lstart) !== MARKER) continue;
      if (state.sCount[nextLine] - state.blkIndent >= 4) continue;
      const closeLen = fenceLength(state.src, lstart, lmax);
      if (closeLen < openLen) continue;
      let p = lstart + closeLen;
      while (p < lmax && (state.src.charCodeAt(p) === 0x20 || state.src.charCodeAt(p) === 0x09)) p++;
      if (p < lmax) continue;
      autoClosed = true;
      break;
    }

    const oldParent = state.parentType;
    const oldLineMax = state.lineMax;
    state.parentType = 'chroma_container';
    state.lineMax = nextLine;

    if (parsed.structure === 'fields') {
      const rows = [];
      for (let ln = startLine + 1; ln < nextLine; ln++) {
        const line = state.src.slice(state.bMarks[ln] + state.tShift[ln], state.eMarks[ln]);
        if (!line.trim()) continue;
        const ci = line.indexOf(':');
        if (ci === -1) rows.push([line.trim(), '']);
        else rows.push([line.slice(0, ci).trim(), line.slice(ci + 1).trim()]);
      }
      const token = state.push('cm_fields', '', 0);
      token.meta = { rows };
      token.map = [startLine, nextLine];
    } else {
      const openToken = state.push('cm_container_open', 'div', 1);
      openToken.meta = parsed;
      openToken.block = true;
      openToken.map = [startLine, nextLine];

      state.md.block.tokenize(state, startLine + 1, nextLine);

      const closeToken = state.push('cm_container_close', 'div', -1);
      closeToken.meta = parsed;
      closeToken.block = true;
    }

    state.parentType = oldParent;
    state.lineMax = oldLineMax;
    state.line = nextLine + (autoClosed ? 1 : 0);
    return true;
  };
}

export default function containerPlugin(md, enabled) {
  md.block.ruler.before('fence', 'cm_container', makeRule(enabled), {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  const esc = md.utils.escapeHtml;

  function decorate(meta) {
    const custom = meta.color ? ' cm-custom' : '';
    const style = meta.color ? ` style="--fg:${esc(meta.color)}"` : '';
    const tone = !meta.color && meta.tone ? ` data-tone="${meta.tone}"` : '';
    return { custom, style, tone };
  }

  md.renderer.rules.cm_container_open = (tokens, idx) => {
    const meta = tokens[idx].meta;
    const { custom, style, tone } = decorate(meta);
    if (meta.structure === 'details') {
      const open = meta.open ? ' open' : '';
      return (
        `<details class="cm-details${custom}"${tone}${style}${open}>` +
        `<summary>${esc(meta.summary)}</summary><div class="cm-body">`
      );
    }
    let html = `<div class="cm-block${custom}"${tone}${style}>`;
    if (meta.title) html += `<div class="cm-title">${esc(meta.title)}</div>`;
    return html + '<div class="cm-body">';
  };

  md.renderer.rules.cm_container_close = (tokens, idx) =>
    tokens[idx].meta.structure === 'details' ? '</div></details>' : '</div></div>';

  md.renderer.rules.cm_fields = (tokens, idx) => {
    let html = '<dl class="cm-fields">';
    for (const [key, value] of tokens[idx].meta.rows) {
      html += `<dt>${esc(key)}</dt><dd>${md.renderInline(value)}</dd>`;
    }
    return html + '</dl>';
  };
}
