import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/index.js';

const inline = (s) => render(s).replace(/^<p>|<\/p>\s*$/g, '').trim();

test('CriticMarkup insertion', () => {
  assert.match(inline('{++added++}'), /<ins class="crit-add">added<\/ins>/);
});

test('CriticMarkup deletion', () => {
  assert.match(inline('{--removed--}'), /<del class="crit-del">removed<\/del>/);
});

test('CriticMarkup substitution renders a del followed by an ins', () => {
  assert.match(
    inline('{~~flights~>query_parameters~~}'),
    /<del class="crit-del">flights<\/del><ins class="crit-add">query_parameters<\/ins>/,
  );
});

test('CriticMarkup highlight', () => {
  assert.match(inline('{==review this==}'), /<mark class="crit-mark">review this<\/mark>/);
});

test('CriticMarkup comment', () => {
  assert.match(inline('{>>a note<<}'), /<span class="crit-comment">a note<\/span>/);
});

test('CriticMarkup escapes HTML in its content', () => {
  assert.match(inline('{++<b>x</b>++}'), /&lt;b&gt;x&lt;\/b&gt;/);
});

test('a lone brace is left untouched', () => {
  assert.match(inline('use { and } freely'), /use \{ and \} freely/);
});
