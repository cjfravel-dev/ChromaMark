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

test('stylesheets only style classes the renderer actually emits', () => {
  const corpus = JSON.parse(read('conformance/cases.json'));
  const emitted = new Set();
  for (const fixture of corpus.cases) {
    for (const match of fixture.html.matchAll(/class="([^"]+)"/g)) {
      for (const name of match[1].split(/\s+/)) emitted.add(name);
    }
  }
  for (const path of [
    'packages/renderer/theme/chromamark.css',
    'packages/vscode/media/chromamark.css',
  ]) {
    const referenced = new Set(
      [...read(path).matchAll(/\.(cm-[a-z0-9-]+|crit-[a-z0-9-]+)/g)].map((match) => match[1]),
    );
    const orphans = [...referenced].filter((name) => !emitted.has(name));
    assert.deepEqual(
      orphans,
      [],
      `${path} styles classes the renderer never emits: ${orphans.join(', ')}`,
    );
  }
});

test('the row-group toggle reserves its box so revealing it never reflows a row', () => {
  for (const path of [
    'packages/renderer/theme/chromamark.css',
    'packages/vscode/media/chromamark.css',
  ]) {
    const css = read(path);
    const base = /\.cm-row-toggle\s*\{([^}]+)\}/.exec(css);
    assert.ok(base, `${path} must define .cm-row-toggle`);
    // Hiding with display:none would collapse the box, so the control would
    // reflow the first cell of every parent row each time the enhancer runs.
    // Incremental previews re-render on every keystroke and the host scroll
    // sync jumps on layout shifts, so only visibility may change.
    assert.doesNotMatch(base[1], /display\s*:\s*none/);
    assert.match(base[1], /visibility\s*:\s*hidden/);
    const ready = /\[data-cm-rowgroups="ready"\]\s*\.cm-row-toggle\s*\{([^}]+)\}/.exec(css);
    assert.ok(ready, `${path} must reveal .cm-row-toggle when ready`);
    assert.match(ready[1], /visibility\s*:\s*visible/);
    assert.doesNotMatch(ready[1], /display\s*:/);
  }
});

test('the preview outline only animates its reflow on deliberate collapse', () => {
  const css = read('packages/vscode/media/toc.css');
  const layout = /body\.cm-has-toc\s*\{([^}]+)\}/.exec(css);
  assert.ok(layout, 'toc.css must define body.cm-has-toc');
  // Transitioning here would animate a 256px document reflow after every
  // incremental preview rebuild, not just when the reader collapses it.
  assert.doesNotMatch(layout[1], /transition/);
  assert.match(css, /body\.cm-toc-animate\s*\{[^}]*transition/);
  const script = read('packages/vscode/media/toc.js');
  assert.match(script, /classList\.add\('cm-toc-animate'\)/);
});

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
  assert.match(readme, /10 KiB/);
});

test('the CDN bundle stays within its documented compressed budget', () => {
  const bundle = readFileSync(new URL('packages/renderer/dist/chromamark.min.js', root));
  assert.ok(gzipSync(bundle).length <= 64 * 1024, 'gzip bundle must remain at or below 64 KiB');
});

test('the slim browser bundle excludes markdown-it and stays under 10 KiB gzip', () => {
  const bundle = readFileSync(new URL('packages/renderer/dist/chromamark.slim.min.js', root));
  assert.ok(gzipSync(bundle).length <= 10 * 1024, 'slim gzip bundle must remain at or below 10 KiB');
  assert.ok(bundle.length <= 32 * 1024, 'slim raw bundle must remain at or below 32 KiB');
});
