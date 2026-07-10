import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  extractPlaygroundDemo,
  encodePlaygroundHash,
  decodePlaygroundHash,
} from './playground-links.mjs';

test('README demo extraction returns one exact marked ChromaMark source block', () => {
  const readme = [
    'before',
    '<!-- playground-demo:start -->',
    '::: info GitHub-native approximation',
    'same source',
    ':::',
    '<!-- playground-demo:end -->',
    'after',
  ].join('\n');
  assert.equal(
    extractPlaygroundDemo(readme),
    '::: info GitHub-native approximation\nsame source\n:::\n',
  );
});

test('README playground hashes are deterministic compressed links', () => {
  const source = ('::: success\nReady [!pass]\n:::\n').repeat(12);
  const first = encodePlaygroundHash(source);
  assert.match(first, /^z\./);
  assert.equal(encodePlaygroundHash(source), first);
});

test('README demo extraction rejects missing or duplicate markers', () => {
  assert.throws(() => extractPlaygroundDemo('none'), /exactly one playground demo/);
  assert.throws(
    () => extractPlaygroundDemo('<!-- playground-demo:start -->\na\n<!-- playground-demo:start -->\nb\n<!-- playground-demo:end -->'),
    /exactly one playground demo/,
  );
});

test('generated README playground link and source block use the exact marked demo', () => {
  const source = readFileSync(new URL('../README.cm', import.meta.url), 'utf8');
  const generated = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const demo = extractPlaygroundDemo(source);
  const match = /playground\/#(z\.[A-Za-z0-9_-]+)/.exec(generated);
  assert.ok(match, 'generated README must contain a compressed playground link');
  assert.equal(decodePlaygroundHash(match[1]), demo);
  assert.ok(generated.includes(`\`\`\`chromamark\n${demo}\`\`\``));
});
