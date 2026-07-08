/**
 * Inline diff via CriticMarkup (http://criticmarkup.com/):
 *   {++insert++}  {--delete--}  {~~old~>new~~}  {==highlight==}  {>>comment<<}
 * Content is treated as plain text and HTML-escaped on output.
 */

const OPEN = 0x7b; // {

const KINDS = {
  '++': { kind: 'add', close: '++}' },
  '--': { kind: 'del', close: '--}' },
  '~~': { kind: 'sub', close: '~~}' },
  '==': { kind: 'mark', close: '==}' },
  '>>': { kind: 'comment', close: '<<}' },
};

function criticRule(state, silent) {
  const start = state.pos;
  const src = state.src;
  if (src.charCodeAt(start) !== OPEN) return false;

  const spec = KINDS[src.slice(start + 1, start + 3)];
  if (!spec) return false;

  const contentStart = start + 3;
  const closeIdx = src.indexOf(spec.close, contentStart);
  if (closeIdx === -1 || closeIdx + spec.close.length > state.posMax) return false;

  const raw = src.slice(contentStart, closeIdx);

  if (!silent) {
    const token = state.push('cm_critic', '', 0);
    if (spec.kind === 'sub') {
      const cut = raw.indexOf('~>');
      token.meta = {
        kind: 'sub',
        old: cut === -1 ? raw : raw.slice(0, cut),
        neu: cut === -1 ? '' : raw.slice(cut + 2),
      };
    } else {
      token.meta = { kind: spec.kind, content: raw };
    }
  }

  state.pos = closeIdx + spec.close.length;
  return true;
}

export default function criticPlugin(md) {
  md.inline.ruler.before('emphasis', 'cm_critic', criticRule);
  const esc = md.utils.escapeHtml;

  md.renderer.rules.cm_critic = (tokens, idx) => {
    const meta = tokens[idx].meta;
    switch (meta.kind) {
      case 'add':
        return `<ins class="crit-add">${esc(meta.content)}</ins>`;
      case 'del':
        return `<del class="crit-del">${esc(meta.content)}</del>`;
      case 'sub':
        return `<del class="crit-del">${esc(meta.old)}</del><ins class="crit-add">${esc(meta.neu)}</ins>`;
      case 'mark':
        return `<mark class="crit-mark">${esc(meta.content)}</mark>`;
      case 'comment':
        return `<span class="crit-comment">${esc(meta.content)}</span>`;
      default:
        return '';
    }
  };
}
