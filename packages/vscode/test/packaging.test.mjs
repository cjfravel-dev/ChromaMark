import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const lines = readFileSync(fileURLToPath(new URL('../.vscodeignore', import.meta.url)), 'utf8')
  .split('\n')
  .map((l) => l.trim());

test('.vscodeignore keeps the test directory out of the VSIX', () => {
  assert.ok(lines.includes('test/**'), 'test/** must be ignored so tests are not shipped');
});

test('.vscodeignore keeps built *.vsix artifacts out of the VSIX', () => {
  assert.ok(lines.includes('*.vsix'), '*.vsix must be ignored so a prior VSIX is not embedded');
});
