/**
 * A linter for ChromaMark source. Because every construct degrades to readable
 * text when malformed, mistakes are otherwise silent — this flags the ones that
 * usually mean the author wanted rich output:
 *   CM001  a construct wrapped in backticks (renders as code, not a pill)
 *   CM002  an unknown tone/color in a pill, colored text, or meter
 *   CM003  an unknown block kind (the ::: fence will render as literal text)
 *   CM004  a meter value that is not NN% or A/B (B ≠ 0)
 *   CM005  a container that is opened but never closed
 *
 * Each diagnostic is { line, column, severity, rule, message } with 1-based
 * positions. Positions are approximate for constructs inside multi-line code
 * spans, which are rare in practice.
 */

import { parseSpec, resolveTone } from './tones.js';

const BLOCK_KINDS = new Set(['details', 'fields', 'block']);
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const isBlockKind = (k) =>
  BLOCK_KINDS.has(k) || Boolean(resolveTone(k)) || k.startsWith('color=') || HEX.test(k);

function meterValueValid(value) {
  const v = String(value == null ? '' : value).trim();
  if (/^\d+(?:\.\d+)?\s*%$/.test(v)) return true;
  const frac = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(v);
  return Boolean(frac) && parseFloat(frac[2]) !== 0;
}

/** True if the char at `idx` is preceded by an odd run of backslashes. */
function isEscaped(line, idx) {
  let n = 0;
  for (let j = idx - 1; j >= 0 && line[j] === '\\'; j--) n++;
  return (n & 1) === 1;
}

/** Backtick-delimited code-span ranges on one line (approximate). */
function codeSpans(line) {
  const runs = [];
  for (let index = 0; index < line.length;) {
    if (line[index] !== '`' || isEscaped(line, index)) {
      index++;
      continue;
    }
    const start = index;
    while (index < line.length && line[index] === '`') index++;
    runs.push({ start, end: index, length: index - start });
  }

  const nextSameLength = new Array(runs.length).fill(-1);
  const nextByLength = new Map();
  for (let index = runs.length - 1; index >= 0; index--) {
    nextSameLength[index] = nextByLength.get(runs[index].length) ?? -1;
    nextByLength.set(runs[index].length, index);
  }

  const ranges = [];
  for (let index = 0; index < runs.length;) {
    const closeIndex = nextSameLength[index];
    if (closeIndex === -1) {
      index++;
      continue;
    }
    const opener = runs[index];
    const closer = runs[closeIndex];
    ranges.push({
      start: opener.start,
      end: closer.end,
      inner: line.slice(opener.end, closer.start),
    });
    index = closeIndex + 1;
  }
  return ranges;
}

const CONSTRUCT_IN_CODE = /\[[!.=]|\{(?:\+\+|--|~~|==|>>)/;

function inlineConstructs(line) {
  const constructs = [];
  const nextClose = new Int32Array(line.length + 1);
  let closingBracket = -1;
  nextClose[line.length] = -1;
  for (let index = line.length - 1; index >= 0; index--) {
    if (line[index] === ']') closingBracket = index;
    nextClose[index] = closingBracket;
  }

  for (let cursor = 0; cursor < line.length;) {
    const start = line.indexOf('[', cursor);
    if (start === -1) break;
    const sigil = line[start + 1];
    if (sigil !== '!' && sigil !== '.' && sigil !== '=') {
      cursor = start + 1;
      continue;
    }

    const specStart = start + 2;
    const close = nextClose[specStart];
    if (close === -1) break;
    let specEnd = specStart;
    while (specEnd < close && !/\s/.test(line[specEnd])) specEnd++;
    if (specEnd === specStart) {
      cursor = start + 1;
      continue;
    }

    let label;
    if (specEnd < close) {
      let labelStart = specEnd;
      while (labelStart < close && /\s/.test(line[labelStart])) labelStart++;
      label = line.slice(labelStart, close);
    }

    constructs.push({
      index: start,
      length: close - start + 1,
      sigil,
      specTok: line.slice(specStart, specEnd),
      label,
    });
    cursor = close + 1;
  }
  return constructs;
}

function scanInline(line, row, diags) {
  const spans = codeSpans(line);
  for (const s of spans) {
    if (CONSTRUCT_IN_CODE.test(s.inner)) {
      diags.push({
        line: row, column: s.start + 1, severity: 'warning', rule: 'CM001',
        message: 'ChromaMark construct is inside backticks; it renders as code, not rich output',
      });
    }
  }
  let spanIndex = 0;
  const inSpan = (idx) => {
    while (spanIndex < spans.length && spans[spanIndex].end <= idx) spanIndex++;
    const span = spans[spanIndex];
    return Boolean(span && idx >= span.start && idx < span.end);
  };

  for (const construct of inlineConstructs(line)) {
    const idx = construct.index;
    if (inSpan(idx) || isEscaped(line, idx)) continue;
    const after = line[idx + construct.length];
    if (after === '(' || after === '[') continue; // markdown link / reference
    const { sigil, specTok, label } = construct;
    const spec = parseSpec(specTok);
    if (!spec) {
      const what = sigil === '!' ? 'pill' : sigil === '.' ? 'colored text' : 'meter';
      diags.push({
        line: row, column: idx + 1, severity: 'warning', rule: 'CM002',
        message: `unknown tone/color "${specTok}"; this looks like a ${what} but renders as literal text`,
      });
    } else if (sigil === '=' && !meterValueValid(label)) {
      diags.push({
        line: row, column: idx + 1, severity: 'warning', rule: 'CM004',
        message: label ? `meter value "${label}" is not NN% or A/B` : 'meter is missing a value (NN% or A/B)',
      });
    }
  }
}

const FENCE_CODE = /^ {0,3}(`{3,}|~{3,})/;
const FENCE_CODE_CLOSE = /^ {0,3}(`{3,}|~{3,})\s*$/;
const CONTAINER = /^( {0,3})(:{3,})(.*)$/;

/**
 * Lint ChromaMark source.
 * @param {string} src
 * @param {{disable?: string[]}} [options] rule ids to suppress (e.g. ['CM001'])
 * @returns {{line:number, column:number, severity:string, rule:string, message:string}[]}
 */
export function lint(src, options = {}) {
  const disabled = new Set(options.disable || []);
  const lines = String(src ?? '').split('\n');
  const diags = [];
  const openStack = [];
  let inCode = false;
  let fenceCh = '';
  let fenceLen = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const row = i + 1;

    if (inCode) {
      const close = FENCE_CODE_CLOSE.exec(line);
      if (close && close[1][0] === fenceCh && close[1].length >= fenceLen) inCode = false;
      continue;
    }
    const codeOpen = FENCE_CODE.exec(line);
    if (codeOpen) {
      inCode = true;
      fenceCh = codeOpen[1][0];
      fenceLen = codeOpen[1].length;
      continue;
    }

    const cont = CONTAINER.exec(line);
    if (cont) {
      const colons = cont[2].length;
      const info = cont[3].trim();
      if (info === '') {
        for (let s = openStack.length - 1; s >= 0; s--) {
          if (colons >= openStack[s].colons) { openStack.splice(s, 1); break; }
        }
        continue;
      }
      const kind = info.split(/\s+/)[0];
      if (!isBlockKind(kind.toLowerCase())) {
        diags.push({
          line: row, column: cont[1].length + colons + 1, severity: 'warning', rule: 'CM003',
          message: `unknown block kind "${kind}"; this ":::" fence renders as literal text`,
        });
      } else {
        openStack.push({ line: row, colons, kind });
      }
    }

    scanInline(line, row, diags);
  }

  for (const o of openStack) {
    diags.push({
      line: o.line, column: 1, severity: 'warning', rule: 'CM005',
      message: `container "${o.kind}" is opened here but never closed (auto-closes at end of input)`,
    });
  }

  return diags
    .filter((d) => !disabled.has(d.rule))
    .sort((a, b) => a.line - b.line || a.column - b.column);
}
