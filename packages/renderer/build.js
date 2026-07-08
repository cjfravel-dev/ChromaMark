/**
 * Bundles the browser entry point into CDN-ready files with the theme CSS
 * embedded (esbuild text loader):
 *   dist/chromamark.esm.js  — ES module (import ChromaMark from …)
 *   dist/chromamark.min.js  — minified IIFE exposing a global `ChromaMark`
 *   dist/chromamark.css     — the standalone theme, for optional <link> use
 */

import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, 'dist');
mkdirSync(dist, { recursive: true });

const shared = {
  entryPoints: [join(here, 'src/browser.js')],
  bundle: true,
  loader: { '.css': 'text' },
  logLevel: 'info',
  target: ['es2019'],
};

await build({ ...shared, format: 'esm', outfile: join(dist, 'chromamark.esm.js') });
await build({
  ...shared,
  format: 'iife',
  globalName: 'ChromaMark',
  minify: true,
  outfile: join(dist, 'chromamark.min.js'),
  footer: { js: 'window.ChromaMark=ChromaMark.default||ChromaMark;' },
});

copyFileSync(join(here, 'theme/chromamark.css'), join(dist, 'chromamark.css'));
console.log('built dist/chromamark.esm.js, dist/chromamark.min.js, dist/chromamark.css');
