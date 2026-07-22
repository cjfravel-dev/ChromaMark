import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkText, DEFAULT_CHUNK_SIZE } from './stream-driver.mjs';

test('empty or nullish input yields no chunks', () => {
  assert.deepEqual(chunkText('', 8), []);
  assert.deepEqual(chunkText(null, 8), []);
  assert.deepEqual(chunkText(undefined), []);
});

test('chunks reassemble losslessly into the original source', () => {
  const source = '# Title\n\n::: success Ready\nBody with **bold** and [!pass 12].\n:::\n';
  const chunks = chunkText(source, 10);
  assert.equal(chunks.join(''), source);
  assert.ok(chunks.length > 1, 'long source should split into multiple chunks');
});

test('chunks break on whitespace boundaries instead of splitting words', () => {
  const chunks = chunkText('one two three four', 4);
  assert.deepEqual(chunks, ['one ', 'two ', 'three ', 'four']);
});

test('a single token longer than the chunk size is emitted whole', () => {
  assert.deepEqual(chunkText('supercalifragilistic', 5), ['supercalifragilistic']);
});

test('chunk size is coerced to a sane minimum', () => {
  const chunks = chunkText('ab cd', 0);
  assert.equal(chunks.join(''), 'ab cd');
  assert.ok(DEFAULT_CHUNK_SIZE >= 1);
});
