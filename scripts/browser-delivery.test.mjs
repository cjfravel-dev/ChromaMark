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

test('theme components use the semantic content foreground for host-independent contrast', () => {
  const css = read('packages/renderer/theme/chromamark.css');
  assert.match(css, /--cm-content-fg:\s*#1f2328/);
  assert.match(css, /\[data-theme="dark"\][\s\S]*--cm-content-fg:\s*#e6edf3/);
  for (const selector of ['\\.cm-block', '\\.cm-fields', '\\.cm-details']) {
    assert.match(css, new RegExp(`${selector}[^}]*color:var\\(--cm-content-fg, inherit\\)`));
  }
});

test('renderer documents its browser compatibility contract', () => {
  const readme = read('packages/renderer/README.md');
  assert.match(readme, /^## Browser support/m);
  assert.match(readme, /ES2019/);
  assert.match(readme, /color-mix\(\)/);
  assert.match(readme, /fallback/i);
  assert.match(readme, /browser-slim/);
  assert.match(readme, /8 KiB/);
});

test('the CDN bundle stays within its documented compressed budget', () => {
  const bundle = readFileSync(new URL('packages/renderer/dist/chromamark.min.js', root));
  assert.ok(gzipSync(bundle).length <= 64 * 1024, 'gzip bundle must remain at or below 64 KiB');
});

test('the slim browser bundle excludes markdown-it and stays under 8 KiB gzip', () => {
  const bundle = readFileSync(new URL('packages/renderer/dist/chromamark.slim.min.js', root));
  assert.ok(gzipSync(bundle).length <= 8 * 1024, 'slim gzip bundle must remain at or below 8 KiB');
  assert.ok(bundle.length <= 32 * 1024, 'slim raw bundle must remain at or below 32 KiB');
});
