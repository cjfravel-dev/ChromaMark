/**
 * Generate GitHub's README.md from the canonical ChromaMark source.
 *
 * Usage:
 *   npm run build:readme
 *   npm run build:readme -- --check
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderGitHub } from '@chromamark/renderer';
import { choosePlaygroundHash, extractPlaygroundDemo } from './playground-links.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'README.cm');
const outputPath = join(root, 'README.md');
const banner = '<!-- Generated from README.cm by npm run build:readme. Do not edit directly. -->\n\n';
const rawSource = readFileSync(sourcePath, 'utf8');
const demo = extractPlaygroundDemo(rawSource);
const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : '';
const playgroundUrl =
  `https://cjfravel-dev.github.io/ChromaMark/playground/#${choosePlaygroundHash(demo, current)}`;
const source = rawSource
  .replace('<!-- playground-demo:start -->', '')
  .replace('<!-- playground-demo:end -->', '')
  .replace('{{PLAYGROUND_DEMO_URL}}', playgroundUrl)
  .replace('{{PLAYGROUND_DEMO_SOURCE}}', demo.trimEnd());
const output = banner + renderGitHub(source, { allowHtml: true });

if (process.argv.includes('--check')) {
  if (current !== output) {
    process.stderr.write('README.md is stale; run npm run build:readme\n');
    process.exitCode = 1;
  }
} else {
  writeFileSync(outputPath, output);
  process.stdout.write('built README.md from README.cm\n');
}
