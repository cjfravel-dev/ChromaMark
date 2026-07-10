const INLINE_TOKENS = [
  'success', 'danger', 'warning', 'info', 'tip', 'muted',
  'ok', 'pass', 'error', 'fail', 'warn', 'note', 'hint', 'skip',
];
const BLOCK_TOKENS = [...INLINE_TOKENS, 'details', 'fields', 'block'];

function distance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 0; i < left.length; i++) {
    const current = [i + 1];
    for (let j = 0; j < right.length; j++) {
      current.push(Math.min(
        current[j] + 1,
        previous[j + 1] + 1,
        previous[j] + (left[i] === right[j] ? 0 : 1),
      ));
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function nearest(value, candidates) {
  const normalized = value.toLowerCase();
  if (normalized.startsWith('color=') || normalized.startsWith('#')) return null;
  let best = null;
  let bestDistance = Infinity;
  let tied = false;
  for (const candidate of candidates) {
    const candidateDistance = distance(normalized, candidate);
    if (candidateDistance < bestDistance) {
      best = candidate;
      bestDistance = candidateDistance;
      tied = false;
    } else if (candidateDistance === bestDistance) {
      tied = true;
    }
  }
  const threshold = Math.max(1, Math.floor(normalized.length / 3));
  return !tied && bestDistance <= threshold ? best : null;
}

function position(line, character) {
  return { line, character };
}

function replacement(title, line, start, end, text) {
  return {
    title,
    start: position(line, start),
    end: position(line, end),
    text,
    preferred: true,
  };
}

function codeSpanFix(line, lineIndex, diagnosticIndex) {
  const spans = /(`+)(.+?)\1/g;
  for (let match; (match = spans.exec(line)); ) {
    const start = match.index;
    const end = start + match[0].length;
    if (diagnosticIndex >= start && diagnosticIndex < end) {
      return replacement(
        'Render ChromaMark construct instead of code',
        lineIndex,
        start,
        end,
        match[2],
      );
    }
  }
  return null;
}

function inlineToneFix(line, lineIndex, diagnosticIndex) {
  const match = /^\[([!.=])([^\s\]]+)/.exec(line.slice(diagnosticIndex));
  if (!match) return null;
  const token = match[2];
  const suggestion = nearest(token, INLINE_TOKENS);
  if (!suggestion) return null;
  const start = diagnosticIndex + 2;
  return replacement(
    `Replace "${token}" with "${suggestion}"`,
    lineIndex,
    start,
    start + token.length,
    suggestion,
  );
}

function blockKindFix(line, lineIndex) {
  const match = /^( {0,3}):{3,}\s*(\S+)/.exec(line);
  if (!match) return null;
  const token = match[2];
  const suggestion = nearest(token, BLOCK_TOKENS);
  if (!suggestion) return null;
  const start = match[0].lastIndexOf(token);
  return replacement(
    `Replace "${token}" with "${suggestion}"`,
    lineIndex,
    start,
    start + token.length,
    suggestion,
  );
}

function meterFix(line, lineIndex, diagnosticIndex) {
  const match = /^\[=([^\s\]]+)(?:\s+([^\]]*))?\]/.exec(line.slice(diagnosticIndex));
  if (!match) return null;
  if (!match[2]) {
    const insert = diagnosticIndex + match[0].length - 1;
    return replacement('Add a 0% meter value', lineIndex, insert, insert, ' 0%');
  }
  const valueStart = diagnosticIndex + match[0].length - 1 - match[2].length;
  return replacement(
    'Replace invalid meter value with 0%',
    lineIndex,
    valueStart,
    valueStart + match[2].length,
    '0%',
  );
}

function closingFenceFix(source, line, _lineIndex) {
  const match = /^ {0,3}(:{3,})/.exec(line);
  if (!match) return null;
  const lines = source.split('\n');
  const endLine = lines.length - 1;
  const endCharacter = lines[endLine].length;
  const fence = match[1];
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const prefix = source.endsWith(eol) ? '' : eol;
  return replacement(
    `Add closing ${fence} fence`,
    endLine,
    endCharacter,
    endCharacter,
    `${prefix}${fence}${eol}`,
  );
}

export function quickFixes(source, diagnostic) {
  const lines = String(source).split('\n');
  const lineIndex = diagnostic.line - 1;
  const line = lines[lineIndex];
  if (line === undefined) return [];
  const diagnosticIndex = Math.max(0, diagnostic.column - 1);
  let fix = null;
  if (diagnostic.code === 'CM001') fix = codeSpanFix(line, lineIndex, diagnosticIndex);
  else if (diagnostic.code === 'CM002') fix = inlineToneFix(line, lineIndex, diagnosticIndex);
  else if (diagnostic.code === 'CM003') fix = blockKindFix(line, lineIndex);
  else if (diagnostic.code === 'CM004') fix = meterFix(line, lineIndex, diagnosticIndex);
  else if (diagnostic.code === 'CM005') fix = closingFenceFix(source, line, lineIndex);
  return fix ? [fix] : [];
}
