import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTone, parseSpec, TONES } from '../src/tones.js';

test('canonical tones resolve to themselves', () => {
  for (const t of TONES) assert.equal(resolveTone(t), t);
});

test('aliases resolve to canonical tones', () => {
  assert.equal(resolveTone('ok'), 'success');
  assert.equal(resolveTone('pass'), 'success');
  assert.equal(resolveTone('error'), 'danger');
  assert.equal(resolveTone('fail'), 'danger');
  assert.equal(resolveTone('warn'), 'warning');
  assert.equal(resolveTone('note'), 'info');
  assert.equal(resolveTone('hint'), 'tip');
  assert.equal(resolveTone('skip'), 'muted');
});

test('resolveTone is case-insensitive', () => {
  assert.equal(resolveTone('PASS'), 'success');
  assert.equal(resolveTone('Warning'), 'warning');
});

test('unknown tone resolves to null', () => {
  assert.equal(resolveTone('bogus'), null);
  assert.equal(resolveTone(''), null);
  assert.equal(resolveTone(undefined), null);
});

test('parseSpec resolves a tone token', () => {
  assert.deepEqual(parseSpec('success'), { tone: 'success', color: null });
  assert.deepEqual(parseSpec('ok'), { tone: 'success', color: null });
});

test('parseSpec resolves color=#hex and bare #hex', () => {
  assert.deepEqual(parseSpec('color=#6f42c1'), { tone: null, color: '#6f42c1' });
  assert.deepEqual(parseSpec('#6f42c1'), { tone: null, color: '#6f42c1' });
  assert.deepEqual(parseSpec('#abc'), { tone: null, color: '#abc' });
});

test('parseSpec resolves color=<name>', () => {
  assert.deepEqual(parseSpec('color=purple'), { tone: null, color: 'purple' });
});

test('parseSpec rejects an unknown bare token', () => {
  assert.equal(parseSpec('nope'), null);
  assert.equal(parseSpec('SHIP'), null);
});
