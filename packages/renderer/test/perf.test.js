import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/index.js';

// These inputs previously triggered O(n^2) rescanning of the line tail for each
// opener. The fix keeps parsing linear; a generous bound (~200x the fixed time,
// far below the multi-second quadratic time) keeps the test robust on slow CI.
const LIMIT_MS = 2000;
const N = 30000;

function timed(fn) {
  const t = Date.now();
  fn();
  return Date.now() - t;
}

test('unclosed inline openers parse in linear time', () => {
  const src = '[!success '.repeat(N);
  const ms = timed(() => render(src));
  assert.ok(ms < LIMIT_MS, `unclosed inline openers took ${ms}ms (expected < ${LIMIT_MS}ms)`);
});

test('many inline openers before a single close parse in linear time', () => {
  const src = '[!x '.repeat(N) + ']';
  const ms = timed(() => render(src));
  assert.ok(ms < LIMIT_MS, `far-close inline took ${ms}ms (expected < ${LIMIT_MS}ms)`);
});

test('unterminated CriticMarkup openers parse in linear time', () => {
  const src = '{++x '.repeat(N);
  const ms = timed(() => render(src));
  assert.ok(ms < LIMIT_MS, `unterminated critic took ${ms}ms (expected < ${LIMIT_MS}ms)`);
});

// ---- Correctness: the linear scan must preserve exact semantics ----

test('unclosed inline opener stays literal', () => {
  assert.match(render('[!success no close'), /\[!success no close/);
});

test('inline construct does not span a newline', () => {
  assert.match(render('[!success a\nb]'), /\[!success a\nb\]/);
});

test('escaped closing bracket is skipped; real close is the later bracket', () => {
  assert.match(render(String.raw`[!success a\]b]`), /class="cm-pill" data-tone="success">a\]b</);
});
