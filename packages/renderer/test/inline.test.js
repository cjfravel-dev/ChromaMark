import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/index.js';

const inline = (s) => render(s).replace(/^<p>|<\/p>\s*$/g, '').trim();

test('a pill with a tone and label renders a badge', () => {
  assert.match(inline('[!success PASS]'), /^<span class="cm-pill" data-tone="success">PASS<\/span>$/);
});

test('a pill without a label uses the uppercased token name', () => {
  assert.match(inline('[!pass]'), /<span class="cm-pill" data-tone="success">PASS<\/span>/);
  assert.match(inline('[!skip]'), /<span class="cm-pill" data-tone="muted">SKIP<\/span>/);
});

test('a pill label may contain spaces', () => {
  assert.match(inline('[!fail 3 of 88]'), /<span class="cm-pill" data-tone="danger">3 of 88<\/span>/);
});

test('a pill supports a custom color via color= and bare hex', () => {
  assert.match(inline('[!color=#6f42c1 beta]'), /<span class="cm-pill cm-custom" style="--fg:#6f42c1">beta<\/span>/);
  assert.match(inline('[!#6f42c1 beta]'), /<span class="cm-pill cm-custom" style="--fg:#6f42c1">beta<\/span>/);
});

test('colored text renders a tinted span with no badge', () => {
  assert.match(inline('[.danger critical]'), /^<span class="cm-text" data-tone="danger">critical<\/span>$/);
});

test('a meter parses a percentage into a fill width', () => {
  const html = inline('[=success 87%]');
  assert.match(html, /<span class="cm-meter" data-tone="success">/);
  assert.match(html, /<span class="cm-fill" style="width:87%"><\/span>/);
  assert.match(html, /<span class="cm-val">87%<\/span>/);
});

test('a meter parses an A/B fraction into a fill width', () => {
  const html = inline('[=info 3/10]');
  assert.match(html, /style="width:30%"/);
  assert.match(html, /<span class="cm-val">3\/10<\/span>/);
});

test('pills work inside GFM table cells', () => {
  const src = [
    '| Suite | Result |',
    '| ----- | ------ |',
    '| unit  | [!pass] |',
  ].join('\n');
  const html = render(src);
  assert.match(html, /<td><span class="cm-pill" data-tone="success">PASS<\/span><\/td>/);
});

test('an unknown pill spec is left as literal text', () => {
  const html = render('status [!nope broken]');
  assert.match(html, /\[!nope broken\]/);
  assert.doesNotMatch(html, /cm-pill/);
});

test('an escaped opener is literal', () => {
  const html = render('literal \\[!success x]');
  assert.match(html, /\[!success x\]/);
  assert.doesNotMatch(html, /cm-pill/);
});

test('HTML in a pill label is escaped', () => {
  assert.match(inline('[!info <b>x</b>]'), /&lt;b&gt;x&lt;\/b&gt;/);
});
