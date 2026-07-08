/**
 * DOM-facing ChromaMark browser API, free of the esbuild-only CSS import so it
 * can be unit-tested under Node/jsdom. The bundle entry (browser.js) supplies
 * the theme via configureTheme() and adds the CDN auto-init.
 */

import { createRenderer, render as renderString } from './index.js';

const STYLE_ID = 'chromamark-theme';
const DONE_ATTR = 'data-chromamark-done';
const DEFAULT_SELECTOR =
  'script[type="text/chromamark"], template.chromamark, [data-chromamark], .chromamark';

/** The theme stylesheet (populated by the bundle via configureTheme). */
export let theme = '';

/** Set the theme CSS used by injectTheme(). Called once by the bundle entry. */
export function configureTheme(css) {
  theme = css || '';
}

/** Render a ChromaMark string to an HTML fragment. */
export function render(src, options) {
  return renderString(src, options);
}

/** Inject the theme <style> once (idempotent). No-op outside a DOM. */
export function injectTheme(doc) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d || d.getElementById(STYLE_ID)) return;
  const style = d.createElement('style');
  style.id = STYLE_ID;
  style.textContent = theme;
  (d.head || d.documentElement).appendChild(style);
}

/** Strip shared leading indentation so source can be indented inside HTML. */
function dedent(text) {
  const lines = text.replace(/\t/g, '  ').replace(/\r/g, '').split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  let min = Infinity;
  for (const line of lines) {
    if (!line.trim()) continue;
    min = Math.min(min, line.match(/^ */)[0].length);
  }
  if (!Number.isFinite(min)) min = 0;
  return lines.map((line) => line.slice(min)).join('\n');
}

function resolve(target) {
  return typeof target === 'string' ? document.querySelector(target) : target;
}

/** Read a holder's raw ChromaMark source. <template> keeps its content in a
 * detached fragment, so read that rather than the (empty) textContent. */
function sourceOf(el, tag) {
  if (tag === 'template' && el.content) return el.content.textContent || '';
  return el.textContent || '';
}

/**
 * Render one element in place. For a <script>/<template> holder the rendered
 * output is inserted as a following sibling; for any other element its own
 * contents are replaced. Returns the element containing the rendered HTML.
 */
export function renderElement(target, options) {
  const el = resolve(target);
  if (!el || el.hasAttribute(DONE_ATTR)) return null;

  const doc = el.ownerDocument || (typeof document !== 'undefined' ? document : null);
  const tag = (el.tagName || '').toLowerCase();
  const html = renderString(dedent(sourceOf(el, tag)), options);
  el.setAttribute(DONE_ATTR, '');

  if (tag === 'script' || tag === 'template') {
    const out = doc.createElement('div');
    out.className = 'chromamark-output';
    out.innerHTML = html;
    // A detached holder has no parent to receive a sibling; return the
    // rendered node anyway so the caller can place it, rather than crashing.
    if (el.parentNode) el.parentNode.insertBefore(out, el.nextSibling);
    return out;
  }
  el.innerHTML = html;
  el.classList.add('chromamark-output');
  return el;
}

/** Render every element matching the selector (defaults to the standard targets). */
export function renderAll(selector, options) {
  const nodes = document.querySelectorAll(selector || DEFAULT_SELECTOR);
  return Array.from(nodes).map((el) => renderElement(el, options));
}

/** One-call setup: inject the theme, then render all targets on the page. */
export function autoRender(options = {}) {
  injectTheme();
  return renderAll(options.selector, options);
}

export const ChromaMark = {
  render,
  renderElement,
  renderAll,
  injectTheme,
  autoRender,
  createRenderer,
  get theme() {
    return theme;
  },
};

export default ChromaMark;
