/**
 * Generates client-side example pages that mirror real CDN usage: the page
 * carries ChromaMark source in a <script type="text/chromamark"> tag and loads
 * the bundle with `data-chromamark-auto`. The library injects its own theme and
 * renders every target — no build-time HTML/CSS and no inline render calls.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE = '../packages/renderer/dist/chromamark.min.js';

// Minimal page chrome only — every ChromaMark style comes from the library.
const BASE_CSS = `
  body { max-width:1040px; margin:0 auto; padding:28px 20px 96px; line-height:1.55;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
    background:var(--bg); color:var(--fg); }
  :root { --bg:#fff; --fg:#1f2328; --panel:#f6f8fa; --line:#d0d7de; }
  [data-theme="dark"] { --bg:#0d1117; --fg:#e6edf3; --panel:#161b22; --line:#30363d; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --bg:#0d1117; --fg:#e6edf3; --panel:#161b22; --line:#30363d; } }
  header.top { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:8px; }
  h2 { margin-top:40px; padding-bottom:6px; border-bottom:1px solid var(--line); }
  code { font-family:ui-monospace,Menlo,Consolas,monospace; font-size:.9em; background:var(--panel);
    border:1px solid var(--line); border-radius:6px; padding:.1em .35em; }
  pre { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:12px 14px; overflow:auto; }
  pre code { background:none; border:none; padding:0; }
  table { border-collapse:collapse; } th,td { border:1px solid var(--line); padding:6px 10px; }
  thead th { background:var(--panel); }
  blockquote { border-left:3px solid var(--line); margin:12px 0; padding:0 14px; color:#8b949e; }
  .toggle { cursor:pointer; border:1px solid var(--line); background:var(--panel); color:var(--fg);
    border-radius:8px; padding:8px 12px; font-weight:600; }
`;

const TOGGLE_JS = `
  document.getElementById('themeBtn').addEventListener('click', function () {
    var r = document.documentElement;
    r.setAttribute('data-theme', r.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
`;

// Neutralize any literal </script> so the source survives inside a <script> tag.
const embed = (src) => src.replace(/<\/script/gi, '<\\/script');

function page(title, source) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${BASE_CSS}</style>
<!-- 1 import. The library injects its own theme and renders every target. -->
<script src="${BUNDLE}" data-chromamark-auto></script>
</head>
<body>
<header class="top"><strong>${title}</strong><button class="toggle" id="themeBtn">◐ Toggle theme</button></header>

<script type="text/chromamark">
${embed(source)}
</script>

<script>${TOGGLE_JS}</script>
</body>
</html>
`;
}

const targets = [
  { src: 'examples/demo.cm', out: 'examples/index.html', title: 'ChromaMark — feature gallery' },
  { src: 'SPEC.md', out: 'examples/spec.html', title: 'ChromaMark Specification' },
];

for (const t of targets) {
  writeFileSync(join(root, t.out), page(t.title, readFileSync(join(root, t.src), 'utf8')), 'utf8');
  console.log(`generated ${t.out} from ${t.src}`);
}
