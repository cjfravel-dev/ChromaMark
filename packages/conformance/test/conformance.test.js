import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadCorpus,
  loadSchema,
  validateCorpus,
  assertCorpus,
  runConformance,
} from '../src/index.js';

test('the published corpus validates and has unique named cases', () => {
  const corpus = loadCorpus();
  assert.deepEqual(validateCorpus(corpus), []);
  assert.equal(corpus.version, 1);
  assert.equal(corpus.languageVersion, '0.1');
  assert.ok(corpus.cases.length > 0);
  assert.equal(new Set(corpus.cases.map((fixture) => fixture.name)).size, corpus.cases.length);
});

test('the published JSON Schema identifies corpus schema version 1', () => {
  const schema = loadSchema();
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.properties.version.const, 1);
  assert.equal(schema.properties.languageVersion.type, 'string');
});

test('validation reports actionable paths for malformed corpora', () => {
  const errors = validateCorpus({
    version: 1,
    languageVersion: '',
    extra: true,
    cases: [
      { name: 'duplicate', source: 42, html: 'x', unexpected: true },
      { name: 'duplicate', source: 'x', html: 42, options: { pill: 'yes' } },
    ],
  });

  assert.ok(errors.includes('languageVersion must be a non-empty string'));
  assert.ok(errors.includes('extra is not supported'));
  assert.ok(errors.includes('cases[0].source must be a string'));
  assert.ok(errors.includes('cases[0].unexpected is not supported'));
  assert.ok(errors.includes('cases[1].html must be a string'));
  assert.ok(errors.includes('cases[1].options.pill must be a boolean'));
  assert.ok(errors.includes('cases[1].name duplicates "duplicate"'));
});

test('assertCorpus throws one error containing all validation failures', () => {
  assert.throws(
    () => assertCorpus({ version: 2, languageVersion: '0.1', cases: [] }),
    /version must equal 1[\s\S]*cases must contain at least one fixture/,
  );
});

test('runConformance supports async renderers and reports exact mismatches', async () => {
  const corpus = {
    version: 1,
    languageVersion: '0.1',
    cases: [
      { name: 'pass', source: 'a', html: '<p>a</p>\n' },
      { name: 'mismatch', source: 'b', options: { pill: false }, html: '<p>b</p>\n' },
      { name: 'error', source: 'c', html: '<p>c</p>\n' },
      { name: 'non-string', source: 'd', html: '<p>d</p>\n' },
    ],
  };
  const seen = [];
  const result = await runConformance(async (source, options) => {
    seen.push([source, options]);
    if (source === 'c') throw new Error('renderer exploded');
    if (source === 'd') return 42;
    return source === 'a' ? '<p>a</p>\n' : '<p>wrong</p>\n';
  }, { corpus, languageVersion: '0.1' });

  assert.deepEqual(seen, [['a', {}], ['b', { pill: false }], ['c', {}], ['d', {}]]);
  assert.equal(result.ok, false);
  assert.equal(result.total, 4);
  assert.equal(result.passed, 1);
  assert.equal(result.failed, 3);
  assert.deepEqual(result.failures.map((failure) => failure.name), ['mismatch', 'error', 'non-string']);
  assert.equal(result.failures[0].actual, '<p>wrong</p>\n');
  assert.match(result.failures[1].error, /renderer exploded/);
  assert.equal(result.failures[2].actual, '42');
});

test('runConformance rejects a renderer language-version mismatch', async () => {
  await assert.rejects(
    runConformance(() => '', {
      corpus: { version: 1, languageVersion: '0.1', cases: [{ name: 'x', source: '', html: '' }] },
      languageVersion: '0.2',
    }),
    /renderer language version 0\.2 does not match corpus 0\.1/,
  );
});
