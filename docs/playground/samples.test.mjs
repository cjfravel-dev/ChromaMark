import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLES } from './samples.mjs';

test('playground samples tell realistic agent-report stories', () => {
  assert.deepEqual(Object.keys(SAMPLES), [
    'Agent code review',
    'Model evaluation',
    'Deployment report',
    'Incident report',
  ]);
  for (const [name, source] of Object.entries(SAMPLES)) {
    assert.match(source, /^# /, name);
    assert.match(source, /:::/, name);
    assert.match(source, /\[!(?:pass|warn|fail|info|success)/, name);
  }
});

test('samples collectively exercise structured reporting constructs', () => {
  const all = Object.values(SAMPLES).join('\n');
  assert.match(all, /::: fields/);
  assert.match(all, /::: details/);
  assert.match(all, /\[=success/);
  assert.match(all, /\{~~/);
  assert.match(all, /\| .* \|/);
});
