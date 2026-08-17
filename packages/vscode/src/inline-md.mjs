/**
 * Serializes a rendered, edited DOM subtree back to ChromaMark source.
 *
 * This is deliberately narrow. It handles only the inline constructs the
 * editable editor marks as "rich" (see `blocks.mjs`): text, emphasis, strong,
 * strikethrough, code spans, links and hard breaks. Anything else — a pill, a
 * meter, an image, a nested list, markup the browser invented while editing —
 * makes the serialization fail, and the caller keeps the original source rather
 * than writing a lossy guess back to the user's file.
 *
 * Failing loudly is the point: a WYSIWYG editor that silently rewrites what it
 * does not understand is how ChromaMark constructs would get flattened.
 */

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

/** Characters that would otherwise be re-parsed as markup when written back. */
function escapeText(value) {
  return value
    .replace(/([\\`*_[\]{}<>])/g, '\\$1')
    .replace(/^(\s*)([#>+-])/gm, '$1\\$2')
    .replace(/^(\s*\d+)\./gm, '$1\\.');
}

/** Collapses the whitespace a contenteditable region accumulates while typing. */
function normalizeSpace(value) {
  return value.replace(/\u00a0/g, ' ').replace(/[ \t\r\n]+/g, ' ');
}

class Unsupported extends Error {}

function serializeChildren(node) {
  let out = '';
  for (const child of node.childNodes) out += serializeNode(child);
  return out;
}

function serializeNode(node) {
  if (node.nodeType === TEXT_NODE) return escapeText(normalizeSpace(node.nodeValue || ''));
  if (node.nodeType !== ELEMENT_NODE) throw new Unsupported();

  const tag = node.tagName.toLowerCase();
  switch (tag) {
    case 'br':
      return '\n';
    case 'strong':
    case 'b': {
      const inner = serializeChildren(node);
      return inner.trim() ? `**${inner}**` : inner;
    }
    case 'em':
    case 'i': {
      const inner = serializeChildren(node);
      return inner.trim() ? `*${inner}*` : inner;
    }
    case 'del':
    case 's':
    case 'strike': {
      const inner = serializeChildren(node);
      return inner.trim() ? `~~${inner}~~` : inner;
    }
    case 'code':
      return `\`${normalizeSpace(node.textContent || '')}\``;
    case 'a': {
      const href = node.getAttribute('href') || '';
      const inner = serializeChildren(node);
      return href ? `[${inner}](${href})` : inner;
    }
    // Browsers wrap edits in bare spans and divs; unwrap the ones that carry no
    // meaning of their own and reject anything that does.
    case 'span':
    case 'font':
      if (node.attributes.length) throw new Unsupported();
      return serializeChildren(node);
    case 'div':
    case 'p':
      if (node.attributes.length) throw new Unsupported();
      return serializeChildren(node);
    default:
      throw new Unsupported();
  }
}

/**
 * Markdown for an edited block element, or `null` when the content contains
 * something this serializer refuses to guess at.
 *
 * `heading` is the heading level of the block, which is re-prefixed because the
 * `#` markers live in the source but not in the rendered element.
 */
export function blockToMarkdown(element, { heading = 0 } = {}) {
  let body;
  try {
    body = serializeChildren(element);
  } catch (error) {
    if (error instanceof Unsupported) return null;
    throw error;
  }

  const text = body.replace(/[ \t]+$/gm, '').trim();
  if (!text) return null;
  if (heading > 0) {
    // A heading is a single line; a break inside one would change the structure.
    if (text.includes('\n')) return null;
    return `${'#'.repeat(heading)} ${text}`;
  }
  return text;
}

/** Heading level of a rendered element, or 0 when it is not a heading. */
export function headingLevel(element) {
  const match = /^h([1-6])$/i.exec(element.tagName || '');
  return match ? Number(match[1]) : 0;
}
