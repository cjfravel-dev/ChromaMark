import { createRenderer } from './index.js';

const REFERENCE_LIKE = /(^|[^\\])\[(?![!.=])[^\]\n]+\](?:\[[^\]\n]*\])?/;

export function createStreamingRenderer(options = {}) {
  const md = createRenderer(options.rendererOptions);
  let source = '';
  let committedSource = '';
  let committedHtml = '';
  let tail = '';
  let tailHtml = '';
  let finalized = false;
  let finalHtml = null;
  const metrics = {
    parsedCharacters: 0,
    verificationCharacters: 0,
    committedCharacters: 0,
    renders: 0,
  };

  const parse = (value, verification = false) => {
    if (verification) metrics.verificationCharacters += value.length;
    else metrics.parsedCharacters += value.length;
    metrics.renders += 1;
    return md.render(value);
  };

  const snapshot = (html = finalHtml ?? committedHtml + tailHtml) => ({
    html,
    committedHtml,
    tailHtml,
    sourceLength: source.length,
    finalized,
    metrics: { ...metrics },
  });

  const commitBoundary = () => {
    if (REFERENCE_LIKE.test(tail)) return;
    const boundaries = [];
    for (let index = tail.indexOf('\n\n'); index !== -1; index = tail.indexOf('\n\n', index + 2)) {
      if (index + 2 < tail.length) boundaries.push(index + 2);
    }
    for (let i = boundaries.length - 1; i >= 0; i--) {
      const boundary = boundaries[i];
      const prefix = tail.slice(0, boundary);
      const suffix = tail.slice(boundary);
      if (!suffix.trim()) continue;
      const prefixHtml = parse(prefix, true);
      const suffixHtml = parse(suffix, true);
      if (prefixHtml + suffixHtml !== tailHtml) continue;
      committedSource += prefix;
      committedHtml += prefixHtml;
      metrics.committedCharacters = committedSource.length;
      tail = suffix;
      tailHtml = suffixHtml;
      return;
    }
  };

  return {
    append(chunk) {
      if (finalized) throw new Error('stream is already finalized');
      const text = String(chunk ?? '');
      source += text;
      tail += text;
      tailHtml = parse(tail);
      commitBoundary();
      return snapshot();
    },
    snapshot,
    finalize() {
      if (!finalized) {
        finalHtml = parse(source);
        finalized = true;
        return snapshot();
      }
      return snapshot();
    },
    get source() {
      return source;
    },
  };
}
