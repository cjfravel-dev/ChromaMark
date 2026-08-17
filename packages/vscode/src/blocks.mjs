/**
 * Source mapping for the experimental editable editor.
 *
 * Every top-level markdown-it block token carries `token.map` — the half-open
 * `[startLine, endLine)` range it was parsed from — and the ChromaMark container
 * plugin sets it too (see `containers.js`). That range is what makes editing in
 * the rendered view safe: an edit rewrites only the lines of the block that was
 * touched, so untouched ChromaMark syntax is never reserialized from the DOM and
 * can never be flattened.
 *
 * Each block is classified into one of two editing modes:
 *
 *   - "rich": the rendered element is directly editable, because its source can
 *     be reconstructed from the DOM without loss. Only plain top-level
 *     paragraphs and headings qualify, and only when their inline content is
 *     limited to text, emphasis, strikethrough, code spans and links.
 *   - "source": the block is edited as its raw ChromaMark source lines. This is
 *     the fallback for containers, fields, tables, code fences, lists, and any
 *     paragraph carrying pills, meters, colored text or change tracking.
 */

import { createRenderer } from '@chromamark/renderer';

/** Inline tokens whose markdown form can be rebuilt from the rendered DOM. */
const LOSSLESS_INLINE = new Set([
  'text',
  'softbreak',
  'strong_open',
  'strong_close',
  'em_open',
  'em_close',
  's_open',
  's_close',
  'code_inline',
  'link_open',
  'link_close',
]);

const RICH_BLOCKS = new Set(['paragraph_open', 'heading_open']);

function isLosslessInline(inlineToken) {
  const children = (inlineToken && inlineToken.children) || [];
  return children.every((child) => LOSSLESS_INLINE.has(child.type));
}

/** Index of the token closing the block opened at `start`. */
function closingIndex(tokens, start) {
  let depth = 0;
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i].nesting === 1) depth += 1;
    else if (tokens[i].nesting === -1) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return start;
}

const CLOSING_FENCE = /^\s*:{3,}\s*$/;

/**
 * ChromaMark containers report `[startLine, nextLine)` where `nextLine` is the
 * line holding the closing `:::` — so the fence sits just outside the reported
 * range (see `containers.js`). Editing that range would orphan the fence, so the
 * closing line is folded back into the block it belongs to.
 */
function withClosingFence(block, lines) {
  const next = lines[block.end];
  if (next === undefined || !CLOSING_FENCE.test(next)) return block;
  return { ...block, end: block.end + 1 };
}

/**
 * Top-level blocks of a parsed token stream, in document order.
 * Returns `{ open, close, start, end, mode }` per block, where `start`/`end`
 * are source lines and `open`/`close` are token indices.
 */
export function blockRanges(tokens, lines = []) {
  const blocks = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.level !== 0 || token.nesting === -1 || !token.map) continue;

    const close = token.nesting === 1 ? closingIndex(tokens, i) : i;
    const rich = RICH_BLOCKS.has(token.type) && isLosslessInline(tokens[i + 1]);
    const block = {
      open: i,
      close,
      start: token.map[0],
      end: token.map[1],
      mode: rich ? 'rich' : 'source',
    };
    blocks.push(rich ? block : withClosingFence(block, lines));
    i = close;
  }
  return blocks;
}

/**
 * Renders `source` to HTML with each top-level block annotated with its source
 * range and editing mode, and returns the blocks alongside the HTML.
 */
export function renderEditable(source, options = {}) {
  const md = createRenderer(options);
  const text = String(source ?? '');
  const env = {};
  const tokens = md.parse(text, env);
  const blocks = blockRanges(tokens, text.split('\n'));

  blocks.forEach((block, index) => {
    const token = tokens[block.open];
    token.attrSet('data-cm-block', String(index));
    token.attrSet('data-cm-start', String(block.start));
    token.attrSet('data-cm-end', String(block.end));
    token.attrSet('data-cm-mode', block.mode);
  });

  return { html: md.renderer.render(tokens, md.options, env), blocks };
}

/**
 * Replaces the half-open line range `[start, end)` of `source` with `text`.
 * Used by tests and by the editor to reason about an edit without a TextDocument.
 */
export function replaceLines(source, start, end, text) {
  const lines = String(source ?? '').split('\n');
  const replacement = String(text ?? '').split('\n');
  return [...lines.slice(0, start), ...replacement, ...lines.slice(end)].join('\n');
}
