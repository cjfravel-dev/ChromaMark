import {
  copyFileSync, readFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pairs = [
  ['conformance/cases.json', 'packages/conformance/cases.json'],
  ['conformance/lint-cases.json', 'packages/conformance/lint-cases.json'],
  ['conformance/schema.json', 'packages/conformance/schema.json'],
];

if (process.argv.includes('--check')) {
  let stale = false;
  for (const [source, target] of pairs) {
    if (readFileSync(join(root, source), 'utf8') !== readFileSync(join(root, target), 'utf8')) {
      process.stderr.write(`${target} is stale; run npm run build:conformance\n`);
      stale = true;
    }
  }
  if (stale) process.exitCode = 1;
} else {
  for (const [source, target] of pairs) {
    copyFileSync(join(root, source), join(root, target));
  }
  process.stdout.write('built @chromamark/conformance corpus assets\n');
}
