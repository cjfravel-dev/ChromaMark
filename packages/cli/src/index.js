/**
 * ChromaMark CLI core: compile a ChromaMark string into a self-contained HTML
 * page (theme inlined, no CDN). Also re-exports the fragment renderer.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { render as renderFragment, renderAnsi, lint } from '@chromamark/renderer';

const require = createRequire(import.meta.url);

/** Render ChromaMark to an HTML fragment (no page chrome). */
export const render = renderFragment;

/** Render ChromaMark to ANSI-styled text for a terminal. */
export { renderAnsi };

/** Lint ChromaMark source, returning an array of diagnostics. */
export { lint };

let cachedTheme;

/** The ChromaMark theme stylesheet, read from @chromamark/renderer. */
export function theme() {
  if (cachedTheme === undefined) {
    cachedTheme = readFileSync(require.resolve('@chromamark/renderer/theme.css'), 'utf8');
  }
  return cachedTheme;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

const BASE_CSS = `
  body { max-width: 1040px; margin: 0 auto; padding: 28px 20px 96px; line-height: 1.55;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: var(--pg-bg); color: var(--pg-fg); }
  :root { --pg-bg:#fff; --pg-fg:#1f2328; --pg-panel:#f6f8fa; --pg-line:#d0d7de; }
  [data-theme="dark"] { --pg-bg:#0d1117; --pg-fg:#e6edf3; --pg-panel:#161b22; --pg-line:#30363d; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --pg-bg:#0d1117; --pg-fg:#e6edf3; --pg-panel:#161b22; --pg-line:#30363d; } }
  h2 { margin-top: 40px; padding-bottom: 6px; border-bottom: 1px solid var(--pg-line); }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: .9em;
    background: var(--pg-panel); border: 1px solid var(--pg-line); border-radius: 6px; padding: .1em .35em; }
  pre { background: var(--pg-panel); border: 1px solid var(--pg-line); border-radius: 8px; padding: 12px 14px; overflow: auto; }
  pre code { background: none; border: none; padding: 0; }
  table { border-collapse: collapse; } th, td { border: 1px solid var(--pg-line); padding: 6px 10px; }
  thead th { background: var(--pg-panel); }
  blockquote { border-left: 3px solid var(--pg-line); margin: 12px 0; padding: 0 14px; color: #8b949e; }
  .cm-toggle { position: fixed; top: 12px; right: 12px; cursor: pointer; border: 1px solid var(--pg-line);
    background: var(--pg-panel); color: var(--pg-fg); border-radius: 8px; padding: 6px 10px; font-size: 13px; }
`;

const TOGGLE_JS =
  "document.querySelector('.cm-toggle').addEventListener('click',function(){" +
  "var r=document.documentElement;r.setAttribute('data-theme'," +
  "r.getAttribute('data-theme')==='dark'?'light':'dark');});";

/**
 * Compile ChromaMark source into a complete, self-contained HTML document.
 * @param {string} src ChromaMark source
 * @param {{title?:string, theme?:string, rendererOptions?:object}} [options]
 */
export function compile(src, options = {}) {
  const title = escapeHtml(options.title || 'ChromaMark');
  const body = renderFragment(String(src ?? ''), options.rendererOptions);
  const css = options.theme != null ? options.theme : theme();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${BASE_CSS}</style>
<style>${css}</style>
</head>
<body>
<button class="cm-toggle" type="button" title="Toggle theme">\u25d0 Theme</button>
${body}
<script>${TOGGLE_JS}</script>
</body>
</html>
`;
}
