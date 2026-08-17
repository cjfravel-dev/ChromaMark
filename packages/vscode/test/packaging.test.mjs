import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const lines = readFileSync(fileURLToPath(new URL('../.vscodeignore', import.meta.url)), 'utf8')
  .split('\n')
  .map((l) => l.trim());

test('.vscodeignore keeps the test directory out of the VSIX', () => {
  assert.ok(lines.includes('test/**'), 'test/** must be ignored so tests are not shipped');
});

test('.vscodeignore keeps built *.vsix artifacts out of the VSIX', () => {
  assert.ok(lines.includes('*.vsix'), '*.vsix must be ignored so a prior VSIX is not embedded');
});

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
);

test('the rendered-editing toggle is reachable from the editor title bar', () => {
  const items = pkg.contributes.menus['editor/title'];
  const toggle = items.find((i) => i.command === 'chromamark.toggleRenderedEditing');
  assert.ok(toggle, 'the toggle must be contributed to editor/title');
  assert.match(toggle.when, /resourceExtname == \.cm/, 'shown for .cm files');
  assert.match(toggle.when, /markdown\.preview/, 'and from the Markdown preview, which cannot be edited');
  assert.ok(
    pkg.contributes.commands.some((c) => c.command === 'chromamark.toggleRenderedEditing' && c.icon),
    'a title-bar action needs an icon',
  );
});

test('the editable editor is offered, never forced, as the default for .cm', () => {
  const [editor] = pkg.contributes.customEditors;
  assert.equal(editor.viewType, 'chromamark.editableEditor');
  assert.equal(editor.priority, 'option', 'the Markdown preview must stay the default surface');
  assert.equal(
    pkg.contributes.configuration.properties['chromamark.experimental.editableEditor'].default,
    false,
  );
});

test('the built bundles are not stale relative to their sources', () => {
  // A stale dist/ silently passes the smoke tests against code that no longer
  // exists, which hides real breakage until the extension is installed.
  // Walked by hand rather than with readdirSync's `recursive` option, which is
  // not in every Node version the CI matrix covers.
  const newest = (dir) => {
    const root = fileURLToPath(new URL(dir, import.meta.url));
    let max = 0;
    const walk = (current) => {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const path = join(current, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (/\.(js|mjs)$/.test(entry.name)) max = Math.max(max, statSync(path).mtimeMs);
      }
    };
    walk(root);
    return max;
  };

  const built = newest('../dist/');
  assert.ok(built > 0, 'dist/ must be built (npm run build) before running the tests');
  assert.ok(
    built >= newest('../src/'),
    'dist/ is older than src/ — run `npm run build --workspace chromamark-vscode`',
  );
});
