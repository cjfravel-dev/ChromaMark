import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

function job(name, nextName) {
  const end = nextName ? `\\n  ${nextName}:` : '$';
  const match = new RegExp(`\\n  ${name}:([\\s\\S]*?)${end}`).exec(workflow);
  assert.ok(match, `CI workflow must define the ${name} job`);
  return match[1];
}

test('renderer CI covers the oldest and current supported Node versions', () => {
  const renderer = job('renderer', 'python');
  assert.match(renderer, /node-version:\s*\[18,\s*24\]/);
  assert.match(renderer, /node-version:\s*\$\{\{\s*matrix\.node-version\s*\}\}/);
  assert.match(renderer, /run:\s*npm run test:scripts/);
});

test('Python CI covers the oldest, representative, and current versions', () => {
  const python = job('python', 'coverage');
  assert.match(python, /python-version:\s*\["3\.9",\s*"3\.12",\s*"3\.14"\]/);
  assert.match(python, /python-version:\s*\$\{\{\s*matrix\.python-version\s*\}\}/);
});
