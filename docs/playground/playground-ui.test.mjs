import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');

test('playground wires theme presets, custom editor, and external samples', () => {
  assert.match(html, /id="report-theme"/);
  assert.match(html, /id="custom-theme"/);
  assert.match(html, /id="theme-error"/);
  assert.match(html, /from '\.\/theme-controls\.mjs'/);
  assert.match(html, /from '\.\/samples\.mjs'/);
  assert.match(html, /applyPlaygroundTheme/);
});
