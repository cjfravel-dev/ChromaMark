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

const diagnosticApi = {
  DiagnosticSeverity: { Warning: 1 },
  Position: class Position {},
  Range: class Range {},
  Diagnostic: class Diagnostic {},
  languages: {
    createDiagnosticCollection: () => ({
      set() {},
      delete() {},
      dispose() {},
    }),
  },
};

const diagnosticWorkspace = {
  textDocuments: [],
  onDidOpenTextDocument: () => ({ dispose() {} }),
  onDidChangeTextDocument: () => ({ dispose() {} }),
  onDidCloseTextDocument: () => ({ dispose() {} }),
};

/** Load the built bundle with a stubbed `vscode`, run activate(), and return the commands it executed. */
async function activateWith({ path, scheme = 'file', languageId = 'markdown', config = {} }) {
  const executed = [];
  const editor = path ? { document: { uri: fakeUri(path, scheme), languageId } } : undefined;
  const vscodeStub = {
    ...diagnosticApi,
    window: {
      activeTextEditor: editor,
      onDidChangeActiveTextEditor: () => ({ dispose() {} }),
      tabGroups: { all: [], onDidChangeTabs: () => ({ dispose() {} }) },
    },
    workspace: {
      ...diagnosticWorkspace,
      getConfiguration: (section) => ({ get: (key) => config[`${section}.${key}`] }),
    },
    commands: { executeCommand: async (cmd) => { executed.push(cmd); }, registerCommand: () => ({ dispose() {} }) },
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

/** Activate with a stubbed vscode, then invoke the registered chromamark.setOpenMode command. */
async function invokeSetOpenMode({ picks }) {
  const registered = {};
  const updates = [];
  let info;
  const ConfigurationTarget = { Global: 1, Workspace: 2, WorkspaceFolder: 3 };
  const vscodeStub = {
    ...diagnosticApi,
    ConfigurationTarget,
    window: {
      activeTextEditor: undefined,
      onDidChangeActiveTextEditor: () => ({ dispose() {} }),
      tabGroups: { all: [], onDidChangeTabs: () => ({ dispose() {} }) },
      showQuickPick: async (items) => {
        const first = items[0] || {};
        if ('ext' in first) return picks.ext ? items.find((i) => i.ext === picks.ext) : undefined;
        if ('value' in first) return picks.mode ? items.find((i) => i.value === picks.mode) : undefined;
        return undefined;
      },
      showInformationMessage: (message) => { info = message; },
    },
    workspace: {
      ...diagnosticWorkspace,
      getConfiguration: (section) => ({
        get: () => undefined,
        update: async (key, value, target) => { updates.push({ key: `${section}.${key}`, value, target }); },
      }),
    },
    commands: {
      executeCommand: async () => {},
      registerCommand: (id, handler) => { registered[id] = handler; return { dispose() {} }; },
    },
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
  const handler = registered['chromamark.setOpenMode'];
  assert.equal(typeof handler, 'function', 'activate() must register chromamark.setOpenMode');
  await handler();
  return { updates, info, target: ConfigurationTarget.Global };
}

test('Set Open Mode writes the chosen .cm mode to user settings', async () => {
  const { updates, target } = await invokeSetOpenMode({ picks: { ext: 'cm', mode: 'source' } });
  assert.deepEqual(updates, [{ key: 'chromamark.cm.openMode', value: 'source', target }]);
});

test('Set Open Mode writes the chosen .md mode to user settings', async () => {
  const { updates, target } = await invokeSetOpenMode({ picks: { ext: 'md', mode: 'preview' } });
  assert.deepEqual(updates, [{ key: 'chromamark.md.openMode', value: 'preview', target }]);
});

test('Set Open Mode makes no change when the file-type pick is cancelled', async () => {
  const { updates } = await invokeSetOpenMode({ picks: { ext: undefined, mode: 'preview' } });
  assert.deepEqual(updates, []);
});

test('Set Open Mode makes no change when the mode pick is cancelled', async () => {
  const { updates } = await invokeSetOpenMode({ picks: { ext: 'cm', mode: undefined } });
  assert.deepEqual(updates, []);
});

test('package.json contributes the Set Open Mode command to the palette', () => {
  const cmds = pkg.contributes?.commands ?? [];
  const setCmd = cmds.find((c) => c.command === 'chromamark.setOpenMode');
  assert.ok(setCmd, 'chromamark.setOpenMode must be contributed');
  assert.equal(setCmd.category, 'ChromaMark');
  assert.match(setCmd.title, /open mode/i);
});
