/**
 * Generate GitHub's README.md from the canonical ChromaMark source.
 *
 * Usage:
 *   npm run build:readme
 *   npm run build:readme -- --check
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderGitHub } from '@chromamark/renderer';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'README.cm');
const outputPath = join(root, 'README.md');
const banner = '<!-- Generated from README.cm by npm run build:readme. Do not edit directly. -->\n\n';
const output = banner + renderGitHub(readFileSync(sourcePath, 'utf8'), { allowHtml: true });

if (process.argv.includes('--check')) {
  const current = readFileSync(outputPath, 'utf8');
  if (current !== output) {
    process.stderr.write('README.md is stale; run npm run build:readme\n');
    process.exitCode = 1;
  }
} else {
  writeFileSync(outputPath, output);
  process.stdout.write('built README.md from README.cm\n');
}
