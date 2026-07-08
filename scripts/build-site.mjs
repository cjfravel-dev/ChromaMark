/**
 * Assembles the GitHub Pages site into an output directory (default: _site):
 *   - playground/index.html  (the editor, with the browser bundle inlined so it
 *     is fully self-contained)
 *   - spec.html, gallery.html, integrations.html  (rendered via the CLI)
 *   - index.html             (a small landing page)
 *
 * Used by the Pages workflow and runnable locally:  node scripts/build-site.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { compile } from '../packages/cli/src/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, process.argv[2] || '_site');
mkdirSync(join(out, 'playground'), { recursive: true });
mkdirSync(join(out, 'assets'), { recursive: true });

// 1) Playground with the bundle inlined (fully self-contained).
const bundle = readFileSync(join(root, 'packages/renderer/dist/chromamark.min.js'), 'utf8');
const playground = readFileSync(join(root, 'docs/playground/index.html'), 'utf8').replace(
  /<script src="[^"]*chromamark\.min\.js"><\/script>/,
  () => `<script>${bundle}</script>`,
);
writeFileSync(join(out, 'playground/index.html'), playground);

// 2) Rendered documents via the CLI compiler.
const docs = [
  { src: 'SPEC.md', out: 'spec.html', title: 'ChromaMark Specification' },
  { src: 'examples/demo.cm', out: 'gallery.html', title: 'ChromaMark — feature gallery' },
];
for (const d of docs) {
  writeFileSync(join(out, d.out), compile(readFileSync(join(root, d.src), 'utf8'), { title: d.title }));
}

// 3) Logo + landing page.
try {
  copyFileSync(join(root, 'docs/assets/chromamark-black.png'), join(out, 'assets/logo.png'));
} catch {}

const landing = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ChromaMark</title>
<style>
  body { max-width: 760px; margin: 0 auto; padding: 48px 20px; text-align: center; line-height: 1.6;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #1f2328; }
  img { width: 260px; max-width: 70%; }
  p.tag { font-size: 18px; color: #57606a; }
  nav { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 28px; }
  a.btn { text-decoration: none; border: 1px solid #d0d7de; border-radius: 10px; padding: 10px 18px;
    color: #1f2328; font-weight: 600; }
  a.btn.primary { background: #0969da; color: #fff; border-color: #0969da; }
</style></head>
<body>
  <img src="assets/logo.png" alt="ChromaMark">
  <p class="tag">A lean rich-markup for agent-to-human communication.</p>
  <nav>
    <a class="btn primary" href="playground/">Playground</a>
    <a class="btn" href="spec.html">Spec</a>
    <a class="btn" href="gallery.html">Gallery</a>
    <a class="btn" href="https://github.com/cjfravel-dev/ChromaMark">GitHub</a>
  </nav>
</body></html>
`;
writeFileSync(join(out, 'index.html'), landing);

console.log(`built site → ${out}`);
