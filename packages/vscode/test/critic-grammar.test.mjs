import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const grammar = JSON.parse(
  readFileSync(fileURLToPath(new URL('../syntaxes/chromamark.injection.tmLanguage.json', import.meta.url)), 'utf8'),
);
const critic = grammar.repository.critic.patterns;

const MARKERS = {
  'markup.inserted.chromamark': ['{++', '++}'],
  'markup.deleted.chromamark': ['{--', '--}'],
  'markup.changed.chromamark': ['{~~', '~~}'],
  'markup.highlight.chromamark': ['{==', '==}'],
  'comment.block.chromamark': ['{>>', '<<}'],
};

test('each CriticMarkup construct uses cross-line begin/end rules, not a single-line match', () => {
  for (const p of critic) {
    assert.ok(p.begin && p.end, `${p.name} must use begin/end so a span can cross lines`);
    assert.ok(!p.match, `${p.name} must not use a single-line match rule`);
  }
});

test('CriticMarkup begin/end delimiters match their intended markers', () => {
  for (const p of critic) {
    const [open, close] = MARKERS[p.name];
    assert.match(open, new RegExp(p.begin), `${p.name} begin should match ${open}`);
    assert.match(close, new RegExp(p.end), `${p.name} end should match ${close}`);
  }
});
