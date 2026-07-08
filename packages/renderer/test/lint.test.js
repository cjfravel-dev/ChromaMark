import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lint } from '../src/index.js';

const rules = (src) => lint(src).map((d) => d.rule).sort();

// ---- Clean input ----
test('a well-formed document produces no diagnostics', () => {
  const src = '::: success Deploy [!ok healthy]\nAll [!pass] and [=info 87%] and [.danger x]\n:::\n';
  assert.deepEqual(lint(src), []);
});

test('valid nested containers are not reported as unclosed', () => {
  const src = ':::: success Deploy\n::: fields\nRegion: eastus\n:::\n::::\n';
  assert.deepEqual(lint(src), []);
});

// ---- CM001 backtick-wrapped construct ----
test('a pill wrapped in backticks is flagged (CM001)', () => {
  const diags = lint('See `[!pass]` above.');
  assert.equal(diags.length, 1);
  assert.equal(diags[0].rule, 'CM001');
  assert.equal(diags[0].line, 1);
  assert.equal(diags[0].column, 5);
});

// ---- CM002 unknown tone in an inline construct ----
test('an unknown tone in a pill is flagged (CM002)', () => {
  const diags = lint('Build [!succes 3]');
  assert.deepEqual(diags.map((d) => d.rule), ['CM002']);
  assert.equal(diags[0].line, 1);
});

test('an unknown tone in colored text and a meter are flagged (CM002)', () => {
  assert.deepEqual(rules('[.wat x] and [=nope 5%]'), ['CM002', 'CM002']);
});

// ---- CM003 unknown block kind ----
test('an unknown block kind is flagged (CM003)', () => {
  const diags = lint('::: succes Title\nbody\n:::\n');
  assert.deepEqual(diags.map((d) => d.rule), ['CM003']);
});

// ---- CM004 invalid meter value ----
test('a non-numeric or divide-by-zero meter value is flagged (CM004)', () => {
  assert.deepEqual(rules('[=success high]'), ['CM004']);
  assert.deepEqual(rules('[=info 3/0]'), ['CM004']);
});

// ---- CM005 unclosed container ----
test('an unclosed container is flagged (CM005)', () => {
  const diags = lint('::: success Deploy\nnever closed');
  assert.deepEqual(diags.map((d) => d.rule), ['CM005']);
  assert.equal(diags[0].line, 1);
});

// ---- False-positive guards ----
test('escaped openers and markdown links are not flagged', () => {
  assert.deepEqual(lint('\\[!succes x] and [=foo](http://e.com) and [!bar][ref]'), []);
});

test('constructs inside fenced code are ignored', () => {
  const src = '```\n[!succes x]\n::: succes T\n```\n';
  assert.deepEqual(lint(src), []);
});

test('every diagnostic carries line, column, severity, and message', () => {
  for (const d of lint('`[!x]`\n[!succes 1]\n::: nope\nz')) {
    assert.ok(Number.isInteger(d.line) && d.line >= 1);
    assert.ok(Number.isInteger(d.column) && d.column >= 1);
    assert.ok(d.severity === 'warning' || d.severity === 'error');
    assert.ok(typeof d.message === 'string' && d.message.length);
  }
});

test('rules can be disabled (e.g. CM001 for documentation)', () => {
  const src = 'See `[!pass]` and also [!succes 3]';
  assert.deepEqual(lint(src).map((d) => d.rule), ['CM001', 'CM002']);
  assert.deepEqual(lint(src, { disable: ['CM001'] }).map((d) => d.rule), ['CM002']);
  assert.deepEqual(lint(src, { disable: ['CM001', 'CM002'] }), []);
});
