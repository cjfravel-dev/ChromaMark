/**
 * Bundles the extension into a single self-contained CommonJS file for the VS
 * Code extension host. The ChromaMark renderer (ESM) and markdown-it are inlined
 * so the packaged VSIX needs no runtime dependency resolution. `vscode` is
 * provided by the host and stays external.
 */

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [join(here, 'src/extension.js')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: ['node18'],
  external: ['vscode'],
  outfile: join(here, 'dist/extension.js'),
  logLevel: 'info',
});

console.log('built dist/extension.js');
