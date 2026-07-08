/**
 * Browser bundle entry point for ChromaMark. Wraps the DOM API in browser-core
 * with the esbuild-embedded theme and a CDN auto-init:
 *
 *   <script type="text/chromamark" id="report">::: success ... :::</script>
 *   <script src=".../chromamark.min.js" data-chromamark-auto></script>
 *
 * Or drive it explicitly:
 *   import ChromaMark from '.../chromamark.esm.js';
 *   ChromaMark.autoRender();               // inject theme + render targets
 *   ChromaMark.renderElement('#report');   // render one section
 */

import themeCss from '../theme/chromamark.css';
import ChromaMark, { configureTheme, autoRender } from './browser-core.js';

configureTheme(themeCss);

export * from './browser-core.js';
export default ChromaMark;

/*
 * CDN convenience: when loaded as a classic <script … data-chromamark-auto>,
 * inject the theme and render all targets once the DOM is ready. ES module
 * imports (currentScript === null) opt in explicitly via autoRender().
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
