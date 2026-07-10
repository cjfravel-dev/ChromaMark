import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quickFixes } from '../src/code-actions.mjs';

test('CM001 unwraps a backticked ChromaMark construct', () => {
  assert.deepEqual(
    quickFixes('See `[!pass]` above.', { code: 'CM001', line: 1, column: 5 }),
    [{
      title: 'Render ChromaMark construct instead of code',
      start: { line: 0, character: 4 },
      end: { line: 0, character: 13 },
      text: '[!pass]',
      preferred: true,
    }],
  );
});

test('CM002 replaces a misspelled inline tone with the nearest known token', () => {
  const [fix] = quickFixes('Build [!succes 3]', { code: 'CM002', line: 1, column: 7 });
  assert.equal(fix.title, 'Replace "succes" with "success"');
  assert.deepEqual(fix.start, { line: 0, character: 8 });
  assert.deepEqual(fix.end, { line: 0, character: 14 });
  assert.equal(fix.text, 'success');
  assert.equal(fix.preferred, true);
});

test('CM003 replaces a misspelled block kind', () => {
  const [fix] = quickFixes('  ::: succes Deploy', { code: 'CM003', line: 1, column: 6 });
  assert.equal(fix.title, 'Replace "succes" with "success"');
  assert.deepEqual(fix.start, { line: 0, character: 6 });
  assert.deepEqual(fix.end, { line: 0, character: 12 });
  assert.equal(fix.text, 'success');
});

test('CM004 replaces an invalid meter value and inserts a missing one', () => {
  const [invalid] = quickFixes('Load [=info high]', { code: 'CM004', line: 1, column: 6 });
  assert.equal(invalid.title, 'Replace invalid meter value with 0%');
  assert.equal(invalid.text, '0%');
  assert.deepEqual(invalid.start, { line: 0, character: 12 });
  assert.deepEqual(invalid.end, { line: 0, character: 16 });

  const [missing] = quickFixes('[=success]', { code: 'CM004', line: 1, column: 1 });
  assert.equal(missing.title, 'Add a 0% meter value');
  assert.deepEqual(missing.start, { line: 0, character: 9 });
  assert.deepEqual(missing.end, missing.start);
  assert.equal(missing.text, ' 0%');

  const [collision] = quickFixes('[=info in]', { code: 'CM004', line: 1, column: 1 });
  assert.deepEqual(collision.start, { line: 0, character: 7 });
  assert.deepEqual(collision.end, { line: 0, character: 9 });
});

test('CM005 appends a closing fence matching the opener length', () => {
  assert.deepEqual(
    quickFixes(':::: warning Open\nbody', { code: 'CM005', line: 1, column: 1 }),
    [{
      title: 'Add closing :::: fence',
      start: { line: 1, character: 4 },
      end: { line: 1, character: 4 },
      text: '\n::::\n',
      preferred: true,
    }],
  );
});

test('CM005 preserves CRLF when appending a closing fence', () => {
  const [fix] = quickFixes('::: warning Open\r\nbody', { code: 'CM005', line: 1, column: 1 });
  assert.equal(fix.text, '\r\n:::\r\n');
});

test('unknown diagnostics and unsuggestable tokens have no quick fix', () => {
  assert.deepEqual(quickFixes('[!color=url(x) bad]', { code: 'CM002', line: 1, column: 1 }), []);
  assert.deepEqual(quickFixes('text', { code: 'OTHER', line: 1, column: 1 }), []);
});
