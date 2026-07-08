import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAnsi } from '../src/index.js';

const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const hasSGR = (s, code) => {
  const re = /\x1b\[([0-9;]*)m/g;
  for (let m; (m = re.exec(s)); ) if (m[1].split(';').includes(String(code))) return true;
  return false;
};
const plain = (src, o = {}) => strip(renderAnsi(src, { color: 'never', ...o })).trim();

// ---- Inline pills ----
test('a pill renders as a bracketed icon+label chip', () => {
  assert.equal(plain('[!ok PASS]'), '[✓ PASS]');
});

test('a pill with no label uppercases the tone name', () => {
  assert.equal(plain('[!pass]'), '[✓ PASS]');
});

test('pill tone drives the ANSI color (green for success)', () => {
  const out = renderAnsi('[!ok PASS]', { color: 'always' });
  assert.ok(hasSGR(out, '32'), 'expected green (32) SGR');
  assert.match(out, /PASS/);
});

test('color:never emits no escape sequences', () => {
  const out = renderAnsi('[!fail 3] and [.danger bad] and text', { color: 'never' });
  assert.doesNotMatch(out, /\x1b/);
});

// ---- Colored text ----
test('colored text renders the label only, colored', () => {
  assert.equal(plain('[.danger critical]'), 'critical');
  assert.ok(hasSGR(renderAnsi('[.danger critical]', { color: 'always' }), '31'));
});

// ---- Meters ----
test('a meter renders a unicode bar plus its value', () => {
  const out = plain('[=success 80%]');
  assert.match(out, /█/);
  assert.match(out, /░/);
  assert.match(out, /80%/);
});

// ---- Blocks ----
test('a colored block renders an icon title and a left bar', () => {
  const out = plain('::: success Deploy succeeded\nAll good\n:::');
  assert.match(out, /✓ Deploy succeeded/);
  assert.match(out, /All good/);
  assert.match(out, /┃/);
  assert.ok(hasSGR(renderAnsi('::: success D\nx\n:::', { color: 'always' }), '32'));
});

test('a details block renders expanded with a disclosure marker', () => {
  const out = plain('::: details danger Failures\nFAILED test_x\n:::');
  assert.match(out, /▾ Failures/);
  assert.match(out, /FAILED test_x/);
});

// ---- Fields ----
test('fields render as aligned key/value pairs with inline pills', () => {
  const out = plain('::: fields\nRegion: eastus\nStatus: [!ok healthy]\n:::');
  assert.match(out, /Region\s+eastus/);
  assert.match(out, /Status\s+\[✓ healthy\]/);
});

// ---- Common Markdown ----
test('headings and bullet lists render legibly', () => {
  const out = plain('# Title\n\n- alpha\n- beta');
  assert.match(out, /Title/);
  assert.match(out, /•\s+alpha/);
  assert.match(out, /•\s+beta/);
});

test('a GFM table renders as an aligned grid', () => {
  const out = plain('| Stage | Result |\n| --- | --- |\n| unit | ok |\n| integ | fail |');
  assert.match(out, /Stage\s+Result/);
  assert.match(out, /unit\s+ok/);
  assert.match(out, /integ\s+fail/);
});

test('emphasis and inline code survive as text', () => {
  assert.equal(plain('**bold** and `code`'), 'bold and code');
  assert.ok(hasSGR(renderAnsi('**bold**', { color: 'always' }), '1'));
});

// ---- CriticMarkup ----
test('critic add/del keep their text and get colors', () => {
  assert.equal(plain('{++added++}{--removed--}'), 'addedremoved');
  const out = renderAnsi('{++added++}', { color: 'always' });
  assert.ok(hasSGR(out, '32'));
});

// ---- Degradation of raw HTML ----
test('raw HTML is shown literally, never interpreted', () => {
  assert.match(plain('a <b>x</b> c'), /<b>x<\/b>/);
});
