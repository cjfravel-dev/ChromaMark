/**
 * ChromaMark renderer — a markdown-it plugin adding colored blocks, colored
 * pills, collapsible sections, fields, meters, and inline diff on top of
 * CommonMark + GFM.
 */

import MarkdownIt from 'markdown-it';
import chromamark from './plugin.js';

export { renderAnsi, colorEnabled } from './ansi.js';
export { renderGitHub } from './github.js';
export { lint } from './lint.js';
export { THEME_PRESETS, resolveTheme, applyTheme } from './theme-presets.js';
export { createStreamingRenderer } from './streaming.js';

/** Version of the ChromaMark language contract implemented by this renderer. */
export const LANGUAGE_VERSION = '0.1';

export default chromamark;

/** Build a markdown-it instance preconfigured with ChromaMark (CommonMark + GFM). */
export function createRenderer(options = {}) {
  const { highlight = null, ...pluginOptions } = options;
  const md = new MarkdownIt({ html: false, linkify: true, typographer: false, highlight });
  md.use(chromamark, pluginOptions);
  return md;
}

/** Convenience: render a ChromaMark string to an HTML fragment. */
export function render(src, options = {}) {
  return createRenderer(options).render(String(src ?? ''));
}
