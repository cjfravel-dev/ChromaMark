import { readFileSync } from 'node:fs';

export const CORPUS_SCHEMA_VERSION = 1;

const OPTION_NAMES = new Set([
  'container',
  'details',
  'fields',
  'pill',
  'text',
  'meter',
  'critic',
]);
const CORPUS_NAMES = new Set(['version', 'languageVersion', 'cases']);
const FIXTURE_NAMES = new Set(['name', 'source', 'options', 'html']);

export function loadCorpus() {
  return JSON.parse(readFileSync(new URL('../cases.json', import.meta.url), 'utf8'));
}

export function loadSchema() {
  return JSON.parse(readFileSync(new URL('../schema.json', import.meta.url), 'utf8'));
}

export function validateCorpus(corpus) {
  const errors = [];
  if (!corpus || typeof corpus !== 'object' || Array.isArray(corpus)) {
    return ['corpus must be an object'];
  }
  for (const name of Object.keys(corpus)) {
    if (!CORPUS_NAMES.has(name)) errors.push(`${name} is not supported`);
  }
  if (corpus.version !== CORPUS_SCHEMA_VERSION) {
    errors.push(`version must equal ${CORPUS_SCHEMA_VERSION}`);
  }
  if (typeof corpus.languageVersion !== 'string' || corpus.languageVersion.length === 0) {
    errors.push('languageVersion must be a non-empty string');
  }
  if (!Array.isArray(corpus.cases)) {
    errors.push('cases must be an array');
    return errors;
  }
  if (corpus.cases.length === 0) {
    errors.push('cases must contain at least one fixture');
  }

  const names = new Set();
  corpus.cases.forEach((fixture, index) => {
    const path = `cases[${index}]`;
    if (!fixture || typeof fixture !== 'object' || Array.isArray(fixture)) {
      errors.push(`${path} must be an object`);
      return;
    }
    for (const name of Object.keys(fixture)) {
      if (!FIXTURE_NAMES.has(name)) errors.push(`${path}.${name} is not supported`);
    }
    if (typeof fixture.name !== 'string' || fixture.name.length === 0) {
      errors.push(`${path}.name must be a non-empty string`);
    } else if (names.has(fixture.name)) {
      errors.push(`${path}.name duplicates "${fixture.name}"`);
    } else {
      names.add(fixture.name);
    }
    if (typeof fixture.source !== 'string') errors.push(`${path}.source must be a string`);
    if (typeof fixture.html !== 'string') errors.push(`${path}.html must be a string`);
    if (fixture.options !== undefined) {
      if (!fixture.options || typeof fixture.options !== 'object' || Array.isArray(fixture.options)) {
        errors.push(`${path}.options must be an object`);
      } else {
        for (const [name, value] of Object.entries(fixture.options)) {
          if (!OPTION_NAMES.has(name)) errors.push(`${path}.options.${name} is not supported`);
          else if (typeof value !== 'boolean') errors.push(`${path}.options.${name} must be a boolean`);
        }
      }
    }
  });
  return errors;
}

export function assertCorpus(corpus) {
  const errors = validateCorpus(corpus);
  if (errors.length) {
    throw new Error(`Invalid ChromaMark conformance corpus:\n- ${errors.join('\n- ')}`);
  }
  return corpus;
}

export async function runConformance(render, options = {}) {
  if (typeof render !== 'function') throw new TypeError('render must be a function');
  const corpus = assertCorpus(options.corpus || loadCorpus());
  if (options.languageVersion && options.languageVersion !== corpus.languageVersion) {
    throw new Error(
      `renderer language version ${options.languageVersion} does not match corpus ${corpus.languageVersion}`,
    );
  }

  const failures = [];
  let passed = 0;
  for (const fixture of corpus.cases) {
    try {
      const actual = await render(fixture.source, fixture.options || {});
      if (typeof actual !== 'string') {
        failures.push({
          name: fixture.name,
          expected: fixture.html,
          actual: String(actual),
          error: `renderer returned ${typeof actual}, expected string`,
        });
      } else if (actual !== fixture.html) {
        failures.push({
          name: fixture.name,
          expected: fixture.html,
          actual,
          error: null,
        });
      } else {
        passed += 1;
      }
    } catch (error) {
      failures.push({
        name: fixture.name,
        expected: fixture.html,
        actual: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    ok: failures.length === 0,
    total: corpus.cases.length,
    passed,
    failed: failures.length,
    failures,
  };
}
