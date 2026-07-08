/**
 * Browser entry point for ChromaMark. Bundles the parser + theme so a page can
 * render ChromaMark with a single call and nothing else:
 *
 *   <script type="text/chromamark" id="report">::: success ... :::</script>
 *   <script type="module">
 *     import ChromaMark from '.../chromamark.esm.js';
 *     ChromaMark.autoRender();            // injects theme + renders targets
 *   </script>
 *
 * Or target one section explicitly:
 *   ChromaMark.renderElement('#report');
 *
 * The theme CSS is embedded at bundle time (esbuild text loader).
 */

import { createRenderer, render as renderString } from './index.js';
import themeCss from '../theme/chromamark.css';

const STYLE_ID = 'chromamark-theme';
const DONE_ATTR = 'data-chromamark-done';
const DEFAULT_SELECTOR =
  'script[type="text/chromamark"], template.chromamark, [data-chromamark], .chromamark';

/** The bundled theme stylesheet, exposed for manual injection. */
export const theme = themeCss;

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
  style.textContent = themeCss;
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

/**
 * Render one element in place. For a <script>/<template> holder the rendered
 * output is inserted as a following sibling; for any other element its own
 * contents are replaced. Returns the element containing the rendered HTML.
 */
export function renderElement(target, options) {
  const el = resolve(target);
  if (!el || el.hasAttribute(DONE_ATTR)) return null;

  const html = renderString(dedent(el.textContent || ''), options);
  const tag = (el.tagName || '').toLowerCase();
  el.setAttribute(DONE_ATTR, '');

  if (tag === 'script' || tag === 'template') {
    const out = document.createElement('div');
    out.className = 'chromamark-output';
    out.innerHTML = html;
    el.parentNode.insertBefore(out, el.nextSibling);
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
  theme,
};

export default ChromaMark;

/*
 * CDN convenience: when loaded as a classic <script … data-chromamark-auto>,
 * inject the theme and render all targets once the DOM is ready — no inline
 * JS required. ES module imports (currentScript === null) opt in explicitly
 * by calling autoRender().
 */
(function autoInit() {
  if (typeof document === 'undefined') return;
  const script = document.currentScript;
  if (!script || !script.hasAttribute('data-chromamark-auto')) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => autoRender(), { once: true });
  } else {
    autoRender();
  }
})();
