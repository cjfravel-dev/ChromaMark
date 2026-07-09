import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/index.js';

// The streaming contract (SPEC §12, README "Built for streaming"): a truncated
// document — however it is cut off mid-stream — still renders as well-formed,
// readable HTML. No broken tags, no lost content.

test('an unclosed block auto-closes and renders title, body, and inner pill', () => {
  const out = render('::: success Deploy succeeded\n3/3 replicas [!ok healthy]');
  assert.match(out, /class="cm-block" data-tone="success"/);
  assert.match(out, /class="cm-title">Deploy succeeded</);
  assert.match(out, /class="cm-pill" data-tone="success">healthy</);
});

test('an unclosed details auto-closes and renders expanded', () => {
  const out = render('::: details danger Failures\nFAILED test_x');
  assert.match(out, /<details class="cm-details" data-tone="danger">/);
  assert.match(out, /FAILED test_x/);
});

test('a truncated pill degrades to literal text', () => {
  assert.equal(render('Build [!pass').trim(), '<p>Build [!pass</p>');
});

test('a half-written inline opener degrades to literal text', () => {
  for (const s of ['Status: [!', 'x [.', 'y [=']) {
    assert.equal(render(s).trim(), `<p>${s}</p>`);
  }
});

test('every prefix of a report renders as well-formed, balanced HTML', () => {
  const doc = [
    '# Deploy — service-recon',
    '::: success Deploy succeeded in 3m12s',
    'Region `eastus`, 3/3 replicas [!ok healthy].',
    ':::',
    '',
    'Build [!pass] · lint [!warn 12] · coverage [=success 87%]',
    '',
    ':::: details danger Integration failures (3)',
    '::: fields',
    'Suite: recon',
    ':::',
    'FAILED test_recon_merge_precedence',
    '::::',
  ].join('\n');
  const count = (s, re) => (s.match(re) || []).length;
  for (let i = 1; i <= doc.length; i++) {
    const prefix = doc.slice(0, i);
    let out;
    assert.doesNotThrow(() => { out = render(prefix); }, `threw on prefix length ${i}`);
    assert.equal(count(out, /<div/g), count(out, /<\/div>/g), `<div> imbalance at prefix length ${i}`);
    assert.equal(count(out, /<details/g), count(out, /<\/details>/g), `<details> imbalance at prefix length ${i}`);
  }
});
