import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCorpus, runConformance } from '@chromamark/conformance';
import * as renderer from '../src/index.js';

const { render } = renderer;

test('shared conformance corpus renders the expected HTML in JavaScript', async (t) => {
  const corpus = loadCorpus();
  assert.equal(corpus.languageVersion, '0.1');
  assert.equal(renderer.LANGUAGE_VERSION, corpus.languageVersion);

  const result = await runConformance(render, {
    corpus,
    languageVersion: renderer.LANGUAGE_VERSION,
  });
  for (const failure of result.failures) {
    await t.test(failure.name, () => {
      assert.equal(failure.actual, failure.expected, failure.error || failure.name);
    });
  }
  assert.equal(result.ok, true);
  assert.equal(result.passed, corpus.cases.length);
});
