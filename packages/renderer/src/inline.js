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

function splitSpec(inner) {
  const match = inner.match(/^(\S+)(?:\s+([\s\S]*))?$/);
  if (!match) return null;
  return { specToken: match[1], rest: (match[2] || '').trim() };
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

function findClose(state, from) {
  const src = state.src;
  for (let i = from; i < state.posMax; i++) {
    const c = src.charCodeAt(i);
    if (c === 0x5c) { i++; continue; } // backslash escapes next char
    if (c === 0x0a) return -1; // stay on one line
    if (c === 0x5d) return i; // ]
  }
  return -1;
}

function makeRule(enabled) {
  return function chromaInline(state, silent) {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== OPEN) return false;

    const kind = SIGILS[state.src[start + 1]];
    if (!kind || !enabled[kind]) return false;

    const end = findClose(state, start + 2);
    if (end === -1) return false;

    const inner = state.src.slice(start + 2, end).trim();
    const parts = inner && splitSpec(inner);
    if (!parts) return false;

    const spec = parseSpec(parts.specToken);
    if (!spec) return false;

    const rest = unescape(parts.rest);

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
    return (
      `<span class="cm-meter${custom}"${tone}${style}>` +
      `<span class="cm-track"><span class="cm-fill" style="width:${meta.width}%"></span></span>` +
      `<span class="cm-val">${esc(meta.value)}</span>` +
      `</span>`
    );
  };
}
