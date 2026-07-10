import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TONES, ALIASES } from '../src/tones.js';

const GRAMMAR = fileURLToPath(new URL('../../../docs/grammar.ebnf', import.meta.url));
const SPEC = fileURLToPath(new URL('../../../SPEC.md', import.meta.url));
const COMPATIBILITY = fileURLToPath(new URL('../../../docs/compatibility.md', import.meta.url));

/** Collect the quoted literals on the single-line production named `name`. */
function literalsOf(text, name) {
  const line = text.split('\n').find((l) => new RegExp(`^${name}\\s+::=`).test(l.trim()));
  assert.ok(line, `grammar is missing a "${name}" production`);
  return (line.match(/"([^"]+)"/g) || []).map((s) => s.slice(1, -1));
}

test('docs/grammar.ebnf exists', () => {
  assert.ok(existsSync(GRAMMAR), 'expected docs/grammar.ebnf');
});

test('specification documents language version 0.1 and its compatibility policy', () => {
  const spec = readFileSync(SPEC, 'utf8');
  assert.match(spec, /\*\*Language version:\*\* 0\.1/);
  assert.doesNotMatch(spec, /normative EBNF/);
  const compatibility = readFileSync(COMPATIBILITY, 'utf8');
  assert.match(compatibility, /^# ChromaMark compatibility policy/m);
  assert.match(compatibility, /Language version `0\.1`/);
  assert.match(compatibility, /Package versions are independent/);
});

test('grammar tone list matches the implementation', () => {
  const text = readFileSync(GRAMMAR, 'utf8');
  assert.deepEqual(literalsOf(text, 'tone').sort(), [...TONES].sort());
});

test('grammar alias list matches the implementation', () => {
  const text = readFileSync(GRAMMAR, 'utf8');
  assert.deepEqual(literalsOf(text, 'alias').sort(), Object.keys(ALIASES).sort());
});

test('grammar documents the non-tone block kinds', () => {
  const text = readFileSync(GRAMMAR, 'utf8');
  for (const kind of ['block', 'details', 'fields']) {
    assert.match(text, new RegExp(`"${kind}"`), `grammar should mention the "${kind}" kind`);
  }
});
