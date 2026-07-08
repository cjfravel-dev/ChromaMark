/**
 * ChromaMark renderer — a markdown-it plugin adding colored blocks, colored
 * pills, collapsible sections, fields, meters, and inline diff on top of
 * CommonMark + GFM.
 */

import MarkdownIt from 'markdown-it';
import inlinePlugin from './inline.js';
import criticPlugin from './critic.js';
import containerPlugin from './containers.js';

export { renderAnsi, colorEnabled } from './ansi.js';

const DEFAULTS = {
  container: true, // ::: colored callouts
  details: true, // ::: details collapsibles
  fields: true, // ::: fields key/value lists
  pill: true, // [!…] badges
  text: true, // [.…] colored text
  meter: true, // [=…] progress meters
  critic: true, // CriticMarkup inline diff
};

/** markdown-it plugin entry point: `md.use(chromamark, options)`. */
export default function chromamark(md, options = {}) {
  const opts = { ...DEFAULTS, ...options };

  if (opts.pill || opts.text || opts.meter) {
    inlinePlugin(md, { pill: opts.pill, text: opts.text, meter: opts.meter });
  }
  if (opts.critic) {
    criticPlugin(md);
  }
  if (opts.container || opts.details || opts.fields) {
    containerPlugin(md, {
      callout: opts.container,
      details: opts.details,
      fields: opts.fields,
    });
  }
}

/** Build a markdown-it instance preconfigured with ChromaMark (CommonMark + GFM). */
export function createRenderer(options = {}) {
  const md = new MarkdownIt({ html: false, linkify: true, typographer: false });
  md.use(chromamark, options);
  return md;
}

/** Convenience: render a ChromaMark string to an HTML fragment. */
export function render(src, options = {}) {
  return createRenderer(options).render(String(src ?? ''));
}
