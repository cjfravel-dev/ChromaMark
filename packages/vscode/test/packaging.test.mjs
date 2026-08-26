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

test('one pencil in the title bar toggles rendered editing both ways', () => {
  const items = pkg.contributes.menus['editor/title'];
  const toggle = items.find((i) => i.command === 'chromamark.toggleRenderedEditing');
  assert.ok(toggle, 'the toggle must be contributed to editor/title');
  assert.equal(items.length, 1, 'one icon, not one per direction');

  assert.match(toggle.when, /resourceExtname == \.cm/, 'shown for .cm files');
  assert.match(toggle.when, /resourceExtname == \.md/, 'and for .md files, edited the same way');
  assert.match(toggle.when, /markdown\.preview/, 'and from the Markdown preview, which cannot be edited');
  // Neither key covering the rendered editor can be relied on alone: the
  // built-in one did not match in practice, so the extension sets its own and
  // the clause accepts either. Without one of them the pencil vanishes on entry
  // and there is no way back out.
  assert.match(toggle.when, /chromamark\.inRenderedEditor/);
  assert.match(toggle.when, /activeCustomEditorId == chromamark\.editableEditor/);

  const command = pkg.contributes.commands.find((c) => c.command === 'chromamark.toggleRenderedEditing');
  assert.equal(command.icon, '$(edit)');

  // The toggle is a property of the surface you are looking at, and cannot be
  // resolved from a palette that has no editor context.
  const palette = pkg.contributes.menus.commandPalette.find(
    (i) => i.command === 'chromamark.toggleRenderedEditing',
  );
  assert.ok(palette, 'the command must be listed in commandPalette to be hidden from it');
  assert.equal(palette.when, 'false');
});

test('the editable editor is offered, never forced, for .cm and .md', () => {
  const [editor] = pkg.contributes.customEditors;
  assert.equal(editor.viewType, 'chromamark.editableEditor');
  assert.deepEqual(
    editor.selector.map((s) => s.filenamePattern).sort(),
    ['*.cm', '*.md'],
  );
  assert.equal(editor.priority, 'option', 'the Markdown preview must stay the default surface');
  assert.ok(
    !Object.keys(pkg.contributes.configuration.properties).some((key) => /editableEditor/.test(key)),
    'rendered editing is no longer behind a setting; "option" priority is what keeps it opt-in',
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
