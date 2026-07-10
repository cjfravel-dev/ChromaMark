import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStreamingRenderer, render } from '../src/index.js';
import { createStreamingElement } from '../src/browser-core.js';
import { JSDOM } from 'jsdom';

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

const STREAM_REPORT = '# Deploy\n\n::: success Ready\nAll good [!pass]\n:::\n\nFinal paragraph.';

test('incremental snapshots and final HTML equal normal rendering', () => {
  const stream = createStreamingRenderer();
  let source = '';
  for (const chunk of ['# Deploy\n\n', '::: success Ready\n', 'All good [!pass]\n:::\n\n', 'Final paragraph.']) {
    source += chunk;
    assert.equal(stream.append(chunk).html, render(source));
  }
  assert.equal(stream.finalize().html, render(source));
});

test('incremental sessions commit isolated blocks and reduce parsed characters', () => {
  const stream = createStreamingRenderer();
  let naive = 0;
  let length = 0;
  for (const chunk of STREAM_REPORT.match(/.{1,12}/gs)) {
    length += chunk.length;
    naive += length;
    stream.append(chunk);
  }
  const final = stream.finalize();
  assert.ok(final.metrics.committedCharacters > 0);
  assert.ok(final.metrics.parsedCharacters < naive);
});

test('reference links stay mutable and finalization is exact', () => {
  const source = 'See [docs].\n\nMore text.\n\n[docs]: https://example.com\n';
  const stream = createStreamingRenderer();
  stream.append('See [docs].\n\n');
  stream.append('More text.\n\n');
  const linked = stream.append('[docs]: https://example.com\n');
  assert.equal(linked.html, render(source));
  const final = stream.finalize();
  assert.equal(final.html, render(source));
  assert.equal(stream.snapshot().html, final.html);
  assert.throws(() => stream.append('more'), /already finalized/);
});

test('indented code can continue across a blank line without premature commit', () => {
  const source = 'x\n\n    code\n\n    more';
  const stream = createStreamingRenderer();
  let prefix = '';
  for (const character of source) {
    prefix += character;
    assert.equal(stream.append(character).html, render(prefix));
  }
  assert.equal(stream.finalize().html, render(source));
});

test('browser streaming preserves committed nodes and patches only the tail', () => {
  const dom = new JSDOM('<div id="out"></div>');
  global.document = dom.window.document;
  const stream = createStreamingElement('#out');
  stream.append('# Stable\n\nMutable');
  const heading = dom.window.document.querySelector('[data-cm-stream-stable] h1');
  assert.ok(heading);
  stream.append(' tail');
  assert.equal(dom.window.document.querySelector('[data-cm-stream-stable] h1'), heading);
  assert.match(dom.window.document.querySelector('[data-cm-stream-tail]').innerHTML, /Mutable tail/);
  assert.equal(stream.finalize().html, render('# Stable\n\nMutable tail'));
});
