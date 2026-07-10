/**
 * Inline ChromaMark constructs sharing the `[<sigil>…]` family:
 *   [!spec label]  → pill / badge (filled)
 *   [.spec label]  → colored text (tint, no fill)
 *   [=spec value]  → progress meter (bar)
 *
 * The leading `spec` is a tone/alias, `color=<hex|name>`, or a bare `#hex`.
 * An unrecognized spec makes the rule decline so the text stays literal.
 */

import { parseSpec } from './tones.js';

const OPEN = 0x5b; // [
const SIGILS = { '!': 'pill', '.': 'text', '=': 'meter' };

function unescape(text) {
  return text.replace(/\\([\s\S])/g, '$1');
}

const WS = /\s/;

/**
 * Split an inline construct's body (state.src between `from` and `end`) into its
 * leading spec token and the start of the remaining content, without slicing the
 * whole — possibly huge — span first, so an invalid spec is rejected cheaply.
 * Equivalent to matching `^(\S+)(?:\s+…)?$` on the trimmed body.
 */
function splitInline(src, from, end) {
  let s = from;
  while (s < end && WS.test(src[s])) s++;
  let e = s;
  while (e < end && !WS.test(src[e])) e++;
  if (e === s) return null; // empty / all-whitespace body
  return { specToken: src.slice(s, e), restStart: e };
}

/** Compute a meter fill width (0–100, as a string) from a value like "87%" or "3/10". */
function meterWidth(value) {
  let pct;
  const percent = value.match(/^(\d+(?:\.\d+)?)\s*%$/);
  const fraction = value.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (percent) {
    pct = parseFloat(percent[1]);
  } else if (fraction) {
    const denom = parseFloat(fraction[2]);
    if (denom === 0) return null;
    pct = (parseFloat(fraction[1]) / denom) * 100;
  } else {
    return null;
  }
  pct = Math.max(0, Math.min(100, pct));
  return String(+pct.toFixed(2));
}

/**
 * First index of `needle` (a single char) at or after `from`, memoized on the
 * parse state so N openers on one long line cost O(line) total rather than
 * O(N·line). The cache is valid because `state.src` is constant for a state and
 * the first occurrence at-or-after `from` is monotonic.
 */
function nextIndex(state, slot, needle, from) {
  const c = state[slot];
  if (c !== undefined && c.from <= from && (c.at === -1 || from <= c.at)) return c.at;
  const at = state.src.indexOf(needle, from);
  state[slot] = { from, at };
  return at;
}

/** True if `src[pos]` is escaped by an odd run of backslashes back to `floor`. */
function isEscaped(src, pos, floor) {
  let n = 0;
  for (let i = pos - 1; i >= floor && src.charCodeAt(i) === 0x5c; i--) n++;
  return (n & 1) === 1;
}

/** First unescaped `needle` at or after `from` (escapes counted from `floor`). */
function nextUnescaped(state, slot, needle, from, floor, max) {
  let at = nextIndex(state, slot, needle, from);
  while (at !== -1 && at < max && isEscaped(state.src, at, floor)) {
    at = nextIndex(state, slot, needle, at + 1);
  }
  return at;
}

function findClose(state, from) {
  const max = state.posMax;
  const bracket = nextUnescaped(state, '_cmBr', ']', from, from, max);
  if (bracket === -1 || bracket >= max) return -1;
  const newline = nextUnescaped(state, '_cmNl', '\n', from, from, max);
  if (newline !== -1 && newline < bracket) return -1; // stays on one line
  return bracket;
}

function makeRule(enabled) {
  return function chromaInline(state, silent) {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== OPEN) return false;

    const kind = SIGILS[state.src[start + 1]];
    if (!kind || !enabled[kind]) return false;

    const end = findClose(state, start + 2);
    if (end === -1) return false;

    const src = state.src;
    const parts = splitInline(src, start + 2, end);
    if (!parts) return false;

    const spec = parseSpec(parts.specToken);
    if (!spec) return false;

    const rest = unescape(src.slice(parts.restStart, end).trim());

    let token;
    if (kind === 'meter') {
      if (!rest) return false;
      const width = meterWidth(rest);
      if (width === null) return false;
      if (!silent) {
        token = state.push('cm_meter', '', 0);
        token.meta = { ...spec, value: rest, width };
      }
    } else if (kind === 'text') {
      if (!rest) return false;
      if (!silent) {
        token = state.push('cm_text', '', 0);
        token.meta = { ...spec, label: rest };
      }
    } else {
      const label = rest || (spec.tone ? parts.specToken.toUpperCase() : spec.color);
      if (!silent) {
        token = state.push('cm_pill', '', 0);
        token.meta = { ...spec, label };
      }
    }

    state.pos = end + 1;
    return true;
  };
}

function toneAttrs(meta, escapeHtml) {
  const custom = meta.color ? ' cm-custom' : '';
  const tone = meta.tone ? ` data-tone="${meta.tone}"` : '';
  const style = meta.color ? ` style="--fg:${escapeHtml(meta.color)}"` : '';
  return { custom, tone, style };
}

export default function inlinePlugin(md, enabled) {
  md.inline.ruler.before('link', 'cm_inline', makeRule(enabled));
  const esc = md.utils.escapeHtml;

  md.renderer.rules.cm_pill = (tokens, idx) => {
    const { custom, tone, style } = toneAttrs(tokens[idx].meta, esc);
    return `<span class="cm-pill${custom}"${tone}${style}>${esc(tokens[idx].meta.label)}</span>`;
  };

  md.renderer.rules.cm_text = (tokens, idx) => {
    const { custom, tone, style } = toneAttrs(tokens[idx].meta, esc);
    return `<span class="cm-text${custom}"${tone}${style}>${esc(tokens[idx].meta.label)}</span>`;
  };

  md.renderer.rules.cm_meter = (tokens, idx) => {
    const meta = tokens[idx].meta;
    const { custom, tone, style } = toneAttrs(meta, esc);
    const aria =
      ` role="progressbar" aria-valuemin="0" aria-valuemax="100"` +
      ` aria-valuenow="${meta.width}" aria-valuetext="${esc(meta.value)}"`;
    return (
      `<span class="cm-meter${custom}"${tone}${style}${aria}>` +
      `<span class="cm-track"><span class="cm-fill" style="width:${meta.width}%"></span></span>` +
      `<span class="cm-val">${esc(meta.value)}</span>` +
      `</span>`
    );
  };
}
