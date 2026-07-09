import { test } from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const distPath = fileURLToPath(new URL('../dist/extension.js', import.meta.url));
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'));

function fakeUri(path, scheme = 'file') {
  return { scheme, path, toString: () => `${scheme}://${path}` };
}

/** Load the built bundle with a stubbed `vscode`, run activate(), and return the commands it executed. */
async function activateWith({ path, scheme = 'file', languageId = 'markdown', config = {} }) {
  const executed = [];
  const editor = path ? { document: { uri: fakeUri(path, scheme), languageId } } : undefined;
  const vscodeStub = {
    window: {
      activeTextEditor: editor,
      onDidChangeActiveTextEditor: () => ({ dispose() {} }),
      tabGroups: { all: [], onDidChangeTabs: () => ({ dispose() {} }) },
    },
    workspace: {
      getConfiguration: (section) => ({ get: (key) => config[`${section}.${key}`] }),
    },
    commands: { executeCommand: async (cmd) => { executed.push(cmd); } },
  };
  const origLoad = Module._load;
  Module._load = function (request, ...args) {
    if (request === 'vscode') return vscodeStub;
    return origLoad.call(this, request, ...args);
  };
  try {
    const require = createRequire(import.meta.url);
    delete require.cache[distPath];
    require(distPath).activate({ subscriptions: [] });
  } finally {
    Module._load = origLoad;
  }
  await Promise.resolve();
  return executed;
}

test('the built bundle exists (run npm run build first)', () => {
  assert.ok(existsSync(distPath), 'dist/extension.js must be built before this test');
});

test('.cm with openMode "preview" reopens as the rendered preview', async () => {
  const cmds = await activateWith({ path: '/w/notes.cm', config: { 'chromamark.cm.openMode': 'preview' } });
  assert.deepEqual(cmds, ['markdown.reopenAsPreview']);
});

test('.cm with openMode "sourceAndPreview" opens the preview to the side', async () => {
  const cmds = await activateWith({ path: '/w/notes.cm', config: { 'chromamark.cm.openMode': 'sourceAndPreview' } });
  assert.deepEqual(cmds, ['markdown.showPreviewToSide']);
});

test('.cm with openMode "source" leaves the source editor untouched', async () => {
  const cmds = await activateWith({ path: '/w/notes.cm', config: { 'chromamark.cm.openMode': 'source' } });
  assert.deepEqual(cmds, []);
});

test('.md honours its own openMode setting (source with preview)', async () => {
  const cmds = await activateWith({ path: '/w/readme.md', config: { 'chromamark.md.openMode': 'sourceAndPreview' } });
  assert.deepEqual(cmds, ['markdown.showPreviewToSide']);
});

test('.md with openMode "source" leaves the source editor untouched', async () => {
  const cmds = await activateWith({ path: '/w/readme.md', config: { 'chromamark.md.openMode': 'source' } });
  assert.deepEqual(cmds, []);
});

test('unsupported markdown extensions (.markdown) are left as-is', async () => {
  const cmds = await activateWith({ path: '/w/readme.markdown', config: { 'chromamark.md.openMode': 'preview' } });
  assert.deepEqual(cmds, []);
});

test('non-file schemes are ignored', async () => {
  const cmds = await activateWith({ path: '/w/notes.cm', scheme: 'untitled', config: { 'chromamark.cm.openMode': 'preview' } });
  assert.deepEqual(cmds, []);
});

test('package.json contributes per-extension openMode settings with the expected enum and defaults', () => {
  const props = pkg.contributes?.configuration?.properties ?? {};
  const cm = props['chromamark.cm.openMode'];
  const md = props['chromamark.md.openMode'];
  assert.ok(cm, 'chromamark.cm.openMode must be contributed');
  assert.ok(md, 'chromamark.md.openMode must be contributed');
  for (const setting of [cm, md]) {
    assert.deepEqual(setting.enum, ['preview', 'sourceAndPreview', 'source']);
  }
  assert.equal(cm.default, 'preview', '.cm preserves the current preview-first behaviour');
  assert.equal(md.default, 'sourceAndPreview', '.md defaults to source with preview');
});
