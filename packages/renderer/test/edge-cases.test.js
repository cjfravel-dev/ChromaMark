import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, createRenderer } from '../src/index.js';

const inline = (s) => render(s).replace(/^<p>|<\/p>\s*$/g, '').trim();

// ---- Meter edge cases ----
test('meter rejects division by zero (stays literal)', () => {
  assert.doesNotMatch(render('[=success 0/0]'), /cm-meter/);
  assert.match(render('[=success 0/0]'), /\[=success 0\/0\]/);
});

test('meter clamps values above 100%', () => {
  assert.match(inline('[=success 150%]'), /style="width:100%"/);
});

test('meter rejects negative and non-numeric values', () => {
  assert.doesNotMatch(render('[=success -5%]'), /cm-meter/);
  assert.doesNotMatch(render('[=success high]'), /cm-meter/);
});

test('meter renders a fraction as a percentage width', () => {
  assert.match(inline('[=info 1/4]'), /style="width:25%"/);
});

// ---- Custom color rejection ----
test('unsafe or malformed custom colors stay literal', () => {
  for (const s of ['[!color=red;x label]', '[!color=#12 x]', '[!#ggg x]', '[!purple x]']) {
    assert.doesNotMatch(render(s), /cm-pill/, `expected literal: ${s}`);
  }
});

test('safe custom colors render', () => {
  assert.match(inline('[!color=rebeccapurple x]'), /class="cm-pill cm-custom"/);
  assert.match(inline('[!#0a0 x]'), /style="--fg:#0a0"/);
});

// ---- Escaping ----
test('escaped inline openers stay literal', () => {
  assert.doesNotMatch(render('\\[!success x]'), /cm-pill/);
  assert.doesNotMatch(render('\\[.danger x]'), /cm-text/);
  assert.doesNotMatch(render('\\[=success 50%]'), /cm-meter/);
});

test('an escaped block fence renders literally, not as a container', () => {
  assert.doesNotMatch(render('\\::: success\nhi\n:::'), /cm-block/);
});

// ---- Feature toggles ----
test('each construct can be disabled independently', () => {
  assert.doesNotMatch(createRenderer({ text: false }).render('[.danger x]'), /cm-text/);
  assert.doesNotMatch(createRenderer({ meter: false }).render('[=info 50%]'), /cm-meter/);
  assert.doesNotMatch(createRenderer({ critic: false }).render('{++x++}'), /crit-add/);
  assert.doesNotMatch(createRenderer({ details: false }).render('::: details S\nx\n:::'), /cm-details/);
  assert.doesNotMatch(createRenderer({ fields: false }).render('::: fields\nA: b\n:::'), /cm-fields/);
  assert.doesNotMatch(createRenderer({ container: false }).render('::: success\nx\n:::'), /cm-block/);
  // disabling one does not disable another
  assert.match(createRenderer({ text: false }).render('[!pass]'), /cm-pill/);
});

// ---- Container edge cases ----
test('an unclosed container renders to end of input', () => {
  const out = render('::: success\nno closing fence');
  assert.match(out, /class="cm-block" data-tone="success"/);
  assert.match(out, /no closing fence/);
});

test('deeper nesting works when outer fences use more colons', () => {
  const out = render('::::: danger A\n:::: warning B\n::: info C\nx\n:::\n::::\n:::::');
  assert.match(out, /data-tone="danger"/);
  assert.match(out, /data-tone="warning"/);
  assert.match(out, /data-tone="info"/);
});
