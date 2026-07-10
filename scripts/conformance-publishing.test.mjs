import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publish = readFileSync(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8');
const releasing = readFileSync(new URL('../docs/releasing.md', import.meta.url), 'utf8');

test('Trusted Publishing includes the public conformance package', () => {
  assert.match(publish, /@chromamark\/conformance/);
  assert.match(publish, /npm test --workspace @chromamark\/conformance/);
  assert.match(releasing, /@chromamark\/conformance/);
});

test('npm publishing can be retried manually and publishes established packages first', () => {
  assert.match(publish, /workflow_dispatch:/);
  assert.match(
    publish,
    /for pkg in @chromamark\/renderer @chromamark\/cli @chromamark\/conformance/,
  );
  assert.match(publish, /github\.event_name == 'release'/);
});
