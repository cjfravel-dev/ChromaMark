import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lint } from '../src/index.js';

const corpusUrl = new URL('../../../conformance/lint-cases.json', import.meta.url);

test('JavaScript linter matches the shared diagnostic corpus', async (t) => {
  const corpus = JSON.parse(readFileSync(corpusUrl, 'utf8'));
  assert.equal(corpus.version, 1);
  assert.equal(corpus.languageVersion, '0.1');
  for (const fixture of corpus.cases) {
    await t.test(fixture.name, () => {
      assert.deepEqual(lint(fixture.source, { disable: fixture.disable }), fixture.diagnostics);
    });
  }
});
