import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render } from '../src/index.js';

const corpusUrl = new URL('../../../conformance/cases.json', import.meta.url);

function loadCorpus() {
  return JSON.parse(readFileSync(corpusUrl, 'utf8'));
}

test('shared conformance corpus renders the expected HTML in JavaScript', async (t) => {
  const corpus = loadCorpus();
  assert.equal(corpus.version, 1);
  assert.ok(corpus.cases.length > 0, 'the corpus must contain conformance cases');

  for (const fixture of corpus.cases) {
    await t.test(fixture.name, () => {
      assert.equal(render(fixture.source, fixture.options), fixture.html);
    });
  }
});
