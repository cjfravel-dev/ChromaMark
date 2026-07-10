import { applyTheme, resolveTheme, THEME_PRESETS } from './theme-presets.js';
import chromamark from './plugin.js';

const STYLE_ID = 'chromamark-theme';
const DONE_ATTR = 'data-chromamark-done';
const SRC_ATTR = 'data-chromamark-src';
const ERR_ATTR = 'data-chromamark-error';
const DEFAULT_SELECTOR =
  'script[type="text/chromamark"], template.chromamark, [data-chromamark], [data-chromamark-src], .chromamark';

let renderer = null;
export let theme = '';

export function configureRenderer(fn) {
  if (typeof fn !== 'function') throw new TypeError('renderer must be a function');
  renderer = fn;
}

export function configureMarkdownIt(md, options) {
  if (!md || typeof md.use !== 'function' || typeof md.render !== 'function') {
    throw new TypeError('MarkdownIt instance must expose use() and render()');
  }
  md.use(chromamark, options);
  configureRenderer((source) => md.render(source));
  return md;
}

export function configureTheme(css) {
  theme = css || '';
}

export function render(source, options) {
  if (!renderer) throw new Error('configureRenderer() must be called before rendering');
  return renderer(String(source ?? ''), options);
}

export function injectTheme(doc) {
  const target = doc || (typeof document !== 'undefined' ? document : null);
  if (!target || target.getElementById(STYLE_ID)) return;
  const style = target.createElement('style');
  style.id = STYLE_ID;
  style.textContent = theme;
  (target.head || target.documentElement).appendChild(style);
}

function dedent(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  let prefix = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    const lead = line.match(/^[ \t]*/)[0];
    if (prefix === null) {
      prefix = lead;
      continue;
    }
    let index = 0;
    const limit = Math.min(prefix.length, lead.length);
    while (index < limit && prefix[index] === lead[index]) index++;
    prefix = prefix.slice(0, index);
    if (!prefix) break;
  }
  const cut = prefix ? prefix.length : 0;
  return lines.map((line) => line.slice(cut)).join('\n');
}

function resolve(target) {
  return typeof target === 'string' ? document.querySelector(target) : target;
}

function sourceOf(element, tag) {
  if (tag === 'template' && element.content) return element.content.textContent || '';
  return element.textContent || '';
}

export function renderElement(target, options) {
  const element = resolve(target);
  if (!element || element.hasAttribute(DONE_ATTR)) return null;
  if (element.hasAttribute(SRC_ATTR)) return renderSrc(element, options);
  const doc = element.ownerDocument || document;
  const tag = (element.tagName || '').toLowerCase();
  const html = render(dedent(sourceOf(element, tag)), options);
  element.setAttribute(DONE_ATTR, '');
  if (tag === 'script' || tag === 'template') {
    const output = doc.createElement('div');
    output.className = 'chromamark-output';
    output.innerHTML = html;
    if (element.parentNode) element.parentNode.insertBefore(output, element.nextSibling);
    return output;
  }
  element.innerHTML = html;
  element.classList.add('chromamark-output');
  return element;
}

export function renderSrc(target, options) {
  const element = resolve(target);
  if (!element || element.hasAttribute(DONE_ATTR)) return Promise.resolve(null);
  const url = element.getAttribute(SRC_ATTR);
  if (!url) return Promise.resolve(null);
  element.setAttribute(DONE_ATTR, '');
  const view = element.ownerDocument && element.ownerDocument.defaultView;
  const doFetch = (view && view.fetch) || (typeof fetch !== 'undefined' ? fetch : null);
  const fail = (message) => {
    element.setAttribute(ERR_ATTR, message);
    return null;
  };
  if (!doFetch) return Promise.resolve(fail('ChromaMark: fetch is unavailable'));
  return Promise.resolve(doFetch(url))
    .then((response) => {
      if (!response || !response.ok) throw new Error(`HTTP ${response ? response.status : '?'}`);
      return response.text();
    })
    .then((source) => {
      element.innerHTML = render(source, options);
      element.classList.add('chromamark-output');
      return element;
    })
    .catch((error) => fail(`ChromaMark: failed to load ${url} (${error.message || error})`));
}

export function renderAll(selector, options) {
  return Array.from(document.querySelectorAll(selector || DEFAULT_SELECTOR))
    .map((element) => renderElement(element, options));
}

export function autoRender(options = {}) {
  injectTheme();
  return renderAll(options.selector, options);
}

export { applyTheme, resolveTheme, THEME_PRESETS };

export const ChromaMarkSlim = {
  configureRenderer,
  configureMarkdownIt,
  configureTheme,
  render,
  renderElement,
  renderAll,
  renderSrc,
  injectTheme,
  autoRender,
  applyTheme,
  resolveTheme,
  THEME_PRESETS,
  get theme() { return theme; },
};

export default ChromaMarkSlim;
