/**
 * ANSI / terminal renderer for ChromaMark. Reuses the markdown-it parse (so all
 * ChromaMark constructs and CommonMark + GFM are understood) and walks the token
 * stream into styled text for a TTY: tones become SGR colors, pills become
 * bracketed icon chips, blocks gain a colored left bar, meters draw a unicode
 * bar. Falls back to plain, legible text whenever color is off (NO_COLOR,
 * non-TTY, or `color: 'never'`).
 */

import { createRenderer } from './index.js';

const ESC = '\x1b[';
const RESET = '\x1b[0m';

/** Basic-16 SGR foreground per semantic tone. */
const TONE_SGR = {
  success: '32', danger: '31', warning: '33', info: '36', tip: '35', muted: '90',
};

/** A glyph that distinguishes each tone without relying on color. */
const TONE_ICON = {
  success: '✓', danger: '✗', warning: '⚠', info: 'ℹ', tip: '✱', muted: '·',
};

/** A small CSS-name → RGB map so `color=<name>` still tints a terminal. */
const NAMED_RGB = {
  red: [220, 50, 47], green: [35, 134, 54], blue: [56, 139, 253], yellow: [210, 153, 34],
  orange: [219, 109, 40], purple: [130, 80, 223], magenta: [188, 76, 200], cyan: [57, 197, 207],
  gray: [139, 148, 158], grey: [139, 148, 158], white: [230, 237, 243], black: [1, 4, 9],
};

const hexToRgb = (hex) => {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Resolve a token's meta to an SGR foreground code, or null (no color). */
function sgrFor(meta) {
  if (!meta) return null;
  if (meta.tone) return TONE_SGR[meta.tone] || null;
  if (meta.color) {
    if (meta.color.startsWith('#')) {
      const [r, g, b] = hexToRgb(meta.color);
      return `38;2;${r};${g};${b}`;
    }
    const rgb = NAMED_RGB[meta.color.toLowerCase()];
    if (rgb) return `38;2;${rgb[0]};${rgb[1]};${rgb[2]}`;
  }
  return null;
}

const joinCodes = (...codes) => codes.filter(Boolean).join(';');

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const visibleWidth = (s) => stripAnsi(s).length;
const padEndVisible = (s, w) => s + ' '.repeat(Math.max(0, w - visibleWidth(s)));

/** Wrap text in an SGR sequence when color is enabled and codes are present. */
function paint(ctx, s, codes) {
  return ctx.color && codes ? `${ESC}${codes}m${s}${RESET}` : s;
}

function popCode(stack, code) {
  const i = stack.lastIndexOf(code);
  if (i !== -1) stack.splice(i, 1);
}

function renderPill(ctx, meta) {
  const icon = meta.tone ? TONE_ICON[meta.tone] : '•';
  return paint(ctx, `[${icon} ${meta.label}]`, joinCodes('1', sgrFor(meta)));
}

function renderMeter(ctx, meta, cells = 10) {
  const filled = Math.round((parseFloat(meta.width) / 100) * cells);
  const bar = '█'.repeat(filled) + '░'.repeat(cells - filled);
  return `${paint(ctx, bar, sgrFor(meta))} ${meta.value}`;
}

function renderCritic(ctx, meta) {
  switch (meta.kind) {
    case 'add': return paint(ctx, meta.content, joinCodes('32', '4'));
    case 'del': return paint(ctx, meta.content, joinCodes('31', '9'));
    case 'sub': return paint(ctx, meta.old, joinCodes('31', '9')) + paint(ctx, meta.neu, joinCodes('32', '4'));
    case 'mark': return paint(ctx, meta.content, '7');
    case 'comment': return paint(ctx, `(${meta.content})`, '2');
    default: return '';
  }
}

/** Render an inline token array (with `.children`) into a styled one-liner. */
function renderInline(ctx, children) {
  let out = '';
  const stack = [];
  const cur = () => stack.join(';');
  for (const t of children) {
    switch (t.type) {
      case 'text': out += paint(ctx, t.content, cur()); break;
      case 'softbreak': out += ' '; break;
      case 'hardbreak': out += '\n'; break;
      case 'strong_open': stack.push('1'); break;
      case 'strong_close': popCode(stack, '1'); break;
      case 'em_open': stack.push('3'); break;
      case 'em_close': popCode(stack, '3'); break;
      case 's_open': stack.push('9'); break;
      case 's_close': popCode(stack, '9'); break;
      case 'link_open': stack.push('4'); break;
      case 'link_close': {
        popCode(stack, '4');
        const href = t.__href;
        if (href && !href.startsWith('#')) out += paint(ctx, ` (${href})`, '2');
        break;
      }
      case 'code_inline': out += paint(ctx, t.content, joinCodes(cur(), '36')); break;
      case 'cm_pill': out += renderPill(ctx, t.meta); break;
      case 'cm_text': out += paint(ctx, t.meta.label, joinCodes(cur(), sgrFor(t.meta))); break;
      case 'cm_meter': out += renderMeter(ctx, t.meta); break;
      case 'cm_critic': out += renderCritic(ctx, t.meta); break;
      case 'image': out += paint(ctx, `[image: ${t.content || ''}]`, cur()); break;
      case 'html_inline': out += paint(ctx, t.content, cur()); break;
      default: if (t.content) out += paint(ctx, t.content, cur());
    }
  }
  return out;
}

/** Carry a link's href from link_open to link_close for the inline renderer. */
function tagLinkHrefs(children) {
  const open = [];
  for (const t of children) {
    if (t.type === 'link_open') open.push(t);
    else if (t.type === 'link_close') { const o = open.pop(); if (o) t.__href = o.attrGet('href'); }
  }
}

function inlineString(ctx, text) {
  const toks = ctx.md.parseInline(text || '', {});
  const kids = (toks[0] && toks[0].children) || [];
  tagLinkHrefs(kids);
  return renderInline(ctx, kids);
}

/** Build a shallow tree from the flat markdown-it token stream. */
function buildTree(tokens) {
  const root = { type: 'root', children: [] };
  const stack = [root];
  for (const t of tokens) {
    const top = stack[stack.length - 1];
    if (t.nesting === 1) {
      const node = { type: t.type.replace(/_open$/, ''), token: t, children: [] };
      top.children.push(node);
      stack.push(node);
    } else if (t.nesting === -1) {
      stack.pop();
    } else {
      top.children.push({ type: t.type, token: t, children: t.children || [] });
    }
  }
  return root;
}

/** Render a list of block nodes, one blank line between blocks (lists hug). */
function renderBlocks(ctx, children) {
  const out = [];
  const rendered = children
    .map((c) => ({ node: c, lines: renderNode(ctx, c) }))
    .filter((b) => b.lines.length);
  rendered.forEach((b, i) => {
    const isList = b.node.type === 'bullet_list' || b.node.type === 'ordered_list';
    if (i && !isList) out.push('');
    out.push(...b.lines);
  });
  return out;
}

function renderListItem(ctx, item, marker) {
  const lines = renderBlocks(ctx, item.children);
  const pad = ' '.repeat(marker.length);
  return lines.map((l, i) => (i === 0 ? marker : pad) + l);
}

function renderTable(ctx, node) {
  const rows = [];
  const collect = (n) => {
    for (const c of n.children) {
      if (c.type === 'tr') {
        const cells = c.children
          .filter((x) => x.type === 'th' || x.type === 'td')
          .map((x) => {
            const inline = x.children.find((k) => k.type === 'inline');
            if (inline) tagLinkHrefs(inline.children);
            return inline ? renderInline(ctx, inline.children) : '';
          });
        rows.push(cells);
      } else if (c.children) collect(c);
    }
  };
  collect(node);
  if (!rows.length) return [];
  const cols = Math.max(...rows.map((r) => r.length));
  const widths = [];
  for (let c = 0; c < cols; c++) widths[c] = Math.max(...rows.map((r) => visibleWidth(r[c] || '')));
  const fmt = (r) => r.map((cell, c) => padEndVisible(cell || '', widths[c])).join('   ').replace(/\s+$/, '');
  const out = [fmt(rows[0])];
  out.push(widths.map((w) => paint(ctx, '─'.repeat(w), '2')).join('   '));
  for (let i = 1; i < rows.length; i++) out.push(fmt(rows[i]));
  return out;
}

function renderContainer(ctx, node) {
  const meta = node.token.meta;
  const codes = sgrFor(meta);
  const inner = renderBlocks(ctx, node.children);
  const bar = paint(ctx, '┃', codes) + ' ';
  const lines = [];
  if (meta.structure === 'details') {
    lines.push(bar + paint(ctx, `▾ ${stripAnsi(inlineString(ctx, meta.summary))}`, joinCodes('1', codes)));
  } else if (meta.title) {
    const icon = meta.tone ? `${TONE_ICON[meta.tone]} ` : (meta.color ? '• ' : '');
    lines.push(bar + paint(ctx, icon + stripAnsi(inlineString(ctx, meta.title)), joinCodes('1', codes)));
  }
  for (const l of inner) lines.push(bar + l);
  return lines;
}

function renderFields(ctx, node) {
  const rows = node.token.meta.rows;
  const keyW = Math.max(0, ...rows.map(([k]) => k.length));
  return rows.map(([k, v]) => `  ${paint(ctx, padEndVisible(k, keyW), '1')}   ${inlineString(ctx, v)}`);
}

function renderNode(ctx, node) {
  switch (node.type) {
    case 'root': return renderBlocks(ctx, node.children);
    case 'paragraph': {
      const inline = node.children.find((c) => c.type === 'inline');
      if (!inline) return [];
      tagLinkHrefs(inline.children);
      return renderInline(ctx, inline.children).split('\n');
    }
    case 'heading': {
      const inline = node.children.find((c) => c.type === 'inline');
      const text = inline ? (tagLinkHrefs(inline.children), renderInline(ctx, inline.children)) : '';
      const styled = paint(ctx, text, joinCodes('1', '4'));
      return [styled];
    }
    case 'blockquote':
      return renderBlocks(ctx, node.children).map((l) => paint(ctx, '│', '2') + ' ' + l);
    case 'bullet_list':
      return node.children
        .filter((c) => c.type === 'list_item')
        .flatMap((item) => renderListItem(ctx, item, '• '));
    case 'ordered_list': {
      let n = Number(node.token.attrGet('start') || 1);
      return node.children
        .filter((c) => c.type === 'list_item')
        .flatMap((item) => renderListItem(ctx, item, `${n++}. `));
    }
    case 'list_item': return renderBlocks(ctx, node.children);
    case 'table': return renderTable(ctx, node);
    case 'fence':
    case 'code_block':
      return String(node.token.content).replace(/\n$/, '').split('\n').map((l) => paint(ctx, '  ' + l, '2'));
    case 'hr': return [paint(ctx, '─'.repeat(Math.min(ctx.width, 60)), '2')];
    case 'cm_container': return renderContainer(ctx, node);
    case 'cm_fields': return renderFields(ctx, node);
    case 'inline': {
      tagLinkHrefs(node.children);
      return renderInline(ctx, node.children).split('\n');
    }
    case 'html_block':
      return String(node.token.content).replace(/\n$/, '').split('\n');
    default:
      return node.token && node.token.content ? [node.token.content] : [];
  }
}

/** Decide whether to emit color for the given option and environment. */
export function colorEnabled(option, env = process.env, isTTY = process.stdout && process.stdout.isTTY) {
  if (option === 'always') return true;
  if (option === 'never') return false;
  return Boolean(isTTY) && !('NO_COLOR' in env) && env.TERM !== 'dumb';
}

/**
 * Render ChromaMark source to ANSI-styled text for a terminal.
 * @param {string} src ChromaMark source
 * @param {{color?:'auto'|'always'|'never', width?:number, rendererOptions?:object}} [options]
 */
export function renderAnsi(src, options = {}) {
  const md = createRenderer(options.rendererOptions);
  const ctx = {
    md,
    color: colorEnabled(options.color || 'auto'),
    width: options.width || (process.stdout && process.stdout.columns) || 80,
  };
  const tokens = md.parse(String(src ?? ''), {});
  const tree = buildTree(tokens);
  return renderBlocks(ctx, tree.children).join('\n') + '\n';
}
