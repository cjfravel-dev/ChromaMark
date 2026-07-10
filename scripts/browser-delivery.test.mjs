import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const root = new URL('../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

function customColorRule(css) {
  const match = /\.cm-custom\s*\{([^}]+)\}/.exec(css);
  assert.ok(match, 'theme must define .cm-custom');
  return match[1];
}

test('custom colors retain visible styling without color-mix support', () => {
  for (const path of [
    'packages/renderer/theme/chromamark.css',
    'packages/vscode/media/chromamark.css',
  ]) {
    const rule = customColorRule(read(path));
    assert.match(rule, /--bg:\s*transparent/);
    assert.match(rule, /--bd:\s*currentColor/);
    assert.doesNotMatch(rule, /color-mix\(/);
    assert.match(
      read(path),
      /@supports\s*\(color:\s*color-mix\([^)]*\)\)\s*\{[\s\S]*?\.cm-custom\s*\{[\s\S]*?color-mix\(/,
    );
  }
});

test('renderer documents its browser compatibility contract', () => {
  const readme = read('packages/renderer/README.md');
  assert.match(readme, /^## Browser support/m);
  assert.match(readme, /ES2019/);
  assert.match(readme, /color-mix\(\)/);
  assert.match(readme, /fallback/i);
});

test('the CDN bundle stays within its documented compressed budget', () => {
  const bundle = readFileSync(new URL('packages/renderer/dist/chromamark.min.js', root));
  assert.ok(gzipSync(bundle).length <= 64 * 1024, 'gzip bundle must remain at or below 64 KiB');
});
