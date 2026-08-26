import { test } from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const distPath = fileURLToPath(new URL('../dist/extension.js', import.meta.url));

const diagnostics = [];
const codeActionProviders = [];
const customEditors = [];
const registeredCommands = new Map();
const closedTabs = [];
const executed = [];
let configuration = {};
const cmDocument = {
  languageId: 'markdown',
  uri: { scheme: 'file', path: '/workspace/report.cm', toString: () => 'file:///workspace/report.cm' },
  getText: () => 'Build [!succes 3]\n',
};
const mdDocument = {
  languageId: 'markdown',
  uri: { scheme: 'file', path: '/workspace/README.md', toString: () => 'file:///workspace/README.md' },
  getText: () => 'Build [!succes 3]\n',
};
const remoteCmDocument = {
  languageId: 'markdown',
  uri: {
    scheme: 'vscode-remote',
    path: '/workspace/remote.cm',
    toString: () => 'vscode-remote:///workspace/remote.cm',
  },
  getText: () => 'Build [!succes 3]\n',
};

const vscodeStub = {
  DiagnosticSeverity: { Warning: 1 },
  Disposable: {
    from: (...items) => ({ dispose: () => items.forEach((i) => i && i.dispose && i.dispose()) }),
  },
  Uri: { joinPath: (base, ...parts) => ({ path: [base.path, ...parts].join('/') }) },
  Position: class Position {
    constructor(line, character) { this.line = line; this.character = character; }
  },
  Range: class Range {
    constructor(start, end) { this.start = start; this.end = end; }
  },
  Diagnostic: class Diagnostic {
    constructor(range, message, severity) {
      this.range = range;
      this.message = message;
      this.severity = severity;
    }
  },
  CodeActionKind: { QuickFix: 'quickfix' },
  CodeAction: class CodeAction {
    constructor(title, kind) {
      this.title = title;
      this.kind = kind;
    }
  },
  WorkspaceEdit: class WorkspaceEdit {
    constructor() { this.replacements = []; }
    replace(uri, range, text) { this.replacements.push({ uri, range, text }); }
  },
  languages: {
    createDiagnosticCollection: () => ({
      set: (uri, values) => diagnostics.push({ uri, values }),
      delete: () => {},
      dispose() {},
    }),
    registerCodeActionsProvider: (selector, provider, metadata) => {
      codeActionProviders.push({ selector, provider, metadata });
      return { dispose() {} };
    },
  },
  workspace: {
    textDocuments: [cmDocument, mdDocument, remoteCmDocument],
    onDidOpenTextDocument: () => ({ dispose() {} }),
    onDidChangeTextDocument: () => ({ dispose() {} }),
    onDidCloseTextDocument: () => ({ dispose() {} }),
    createFileSystemWatcher: () => ({
      onDidChange: () => ({ dispose() {} }),
      onDidCreate: () => ({ dispose() {} }),
      onDidDelete: () => ({ dispose() {} }),
      dispose() {},
    }),
    getConfiguration: () => ({ get: (key) => configuration[key] }),
    onDidChangeConfiguration: () => ({ dispose() {} }),
  },
  window: {
    activeTextEditor: undefined,
    onDidChangeActiveTextEditor: () => ({ dispose() {} }),
    tabGroups: {
      all: [],
      activeTabGroup: undefined,
      close: async (tabs) => { closedTabs.push(...tabs); },
      onDidChangeTabs: () => ({ dispose() {} }),
    },
    showInformationMessage: () => {},
    registerCustomEditorProvider: (viewType, provider, options) => {
      const entry = { viewType, provider, options, disposed: false };
      customEditors.push(entry);
      return { dispose() { entry.disposed = true; } };
    },
  },
  commands: {
    executeCommand: async (command, ...args) => {
      executed.push({ command, args });
    },
    registerCommand: (command, handler) => {
      registeredCommands.set(command, handler);
      return { dispose() {} };
    },
  },
};

/** A webview panel stub that records the lifecycle callbacks the editor attaches. */
function renderPanel() {
  const panel = {
    active: true,
    webview: {
      cspSource: 'vscode-resource:',
      asWebviewUri: (uri) => `vscode-resource:${uri.path}`,
      onDidReceiveMessage: () => ({ dispose() {} }),
      postMessage: () => {},
      options: {},
      html: '',
    },
    onDidDispose: (listener) => {
      panel.fireDispose = listener;
      return { dispose() {} };
    },
    onDidChangeViewState: (listener) => {
      panel.fireViewStateChange = listener;
      return { dispose() {} };
    },
  };
  return panel;
}

/** Activates the built bundle with `vscode` stubbed out, returning its API. */
function activateBundle() {
  const origLoad = Module._load;
  Module._load = function (request, ...args) {
    if (request === 'vscode') return vscodeStub;
    return origLoad.call(this, request, ...args);
  };
  try {
    const require = createRequire(import.meta.url);
    delete require.cache[distPath];
    const context = { subscriptions: [], extensionUri: { path: '/ext' } };
    const api = require(distPath).activate(context);
    return api;
  } finally {
    Module._load = origLoad;
  }
}

test('the built extension bundle activates and wires ChromaMark into markdown-it', () => {
  assert.ok(existsSync(distPath), 'dist/extension.js must be built (npm run build) before this test');
  const origLoad = Module._load;
  Module._load = function (request, ...args) {
    if (request === 'vscode') return vscodeStub;
    return origLoad.call(this, request, ...args);
  };
  let api;
  try {
    const require = createRequire(import.meta.url);
    delete require.cache[distPath];
    const ext = require(distPath);
    assert.equal(typeof ext.activate, 'function', 'bundle exports activate()');
    api = ext.activate({ subscriptions: [] });
  } finally {
    Module._load = origLoad;
  }
  assert.equal(typeof api.extendMarkdownIt, 'function', 'activate() returns extendMarkdownIt');
  const md = api.extendMarkdownIt(new MarkdownIt());
  const html = md.render('::: success\nAll good [!pass]\n:::');
  assert.match(html, /<div class="cm-block" data-tone="success">/, 'container renders through the bundle');
  assert.match(html, /class="cm-pill" data-tone="success"/, 'pill renders through the bundle');
  assert.equal(diagnostics.length, 2, 'local and remote .cm documents receive diagnostics, but .md does not');
  assert.equal(diagnostics[0].values.length, 1);
  assert.equal(diagnostics[0].values[0].code, 'CM002');
  assert.equal(diagnostics[0].values[0].source, 'ChromaMark');
  assert.equal(diagnostics[0].values[0].range.start.line, 0);
  assert.equal(diagnostics[0].values[0].range.start.character, 6);
  assert.equal(codeActionProviders.length, 1);
  const actions = codeActionProviders[0].provider.provideCodeActions(
    cmDocument,
    diagnostics[0].values[0].range,
    { diagnostics: diagnostics[0].values },
  );
  assert.equal(actions.length, 1);
  assert.equal(actions[0].title, 'Replace "succes" with "success"');
  assert.equal(actions[0].kind, 'quickfix');
  assert.equal(actions[0].isPreferred, true);
  assert.deepEqual(actions[0].diagnostics, diagnostics[0].values);
  assert.equal(actions[0].edit.replacements.length, 1);
  assert.equal(actions[0].edit.replacements[0].range.start.character, 8);
  assert.equal(actions[0].edit.replacements[0].range.end.character, 14);
  assert.equal(actions[0].edit.replacements[0].text, 'success');
});

test('the rendered editor is registered on activation, without displacing the preview', () => {
  customEditors.length = 0;
  configuration = {};
  activateBundle();
  assert.equal(customEditors.length, 1);
  assert.equal(customEditors[0].viewType, 'chromamark.editableEditor');
  assert.equal(typeof customEditors[0].provider.resolveCustomTextEditor, 'function');
  // Which surface a file opens in is settled by the manifest's "option"
  // priority and the open-mode settings, not by registering the provider.
  assert.equal(customEditors[0].options.supportsMultipleEditorsPerDocument, true);
});

test('the editor webview forbids inline script and allows only a per-load nonce', () => {
  // The webview assigns rendered HTML to innerHTML, which is only safe because
  // nothing inline can run. Escaping is pinned in editable-editor.test.mjs.
  customEditors.length = 0;
  configuration = {};
  activateBundle();

  const panel = {
    webview: {
      cspSource: 'vscode-resource:',
      asWebviewUri: (uri) => `vscode-resource:${uri.path}`,
      onDidReceiveMessage: () => ({ dispose() {} }),
      postMessage: () => {},
      options: {},
      html: '',
    },
    onDidDispose: () => ({ dispose() {} }),
  };
  customEditors[0].provider.resolveCustomTextEditor(cmDocument, panel, {});

  const csp = /Content-Security-Policy" content="([^"]*)"/.exec(panel.webview.html)[1];
  assert.match(csp, /default-src 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/, 'inline script would defeat the nonce');

  const nonce = /script-src 'nonce-([A-Za-z0-9]+)'/.exec(csp)[1];
  assert.equal(nonce.length, 32);
  assert.match(panel.webview.html, new RegExp(`<script nonce="${nonce}"`));

  panel.webview.html = '';
  customEditors[0].provider.resolveCustomTextEditor(cmDocument, panel, {});
  const second = /script-src 'nonce-([A-Za-z0-9]+)'/.exec(panel.webview.html)[1];
  assert.notEqual(second, nonce, 'each load gets its own nonce');
});

test('the rendered editor advertises itself through a context key, so the icons swap', async () => {
  // The exit action is only reachable while this key is set; if it never turns
  // on there is no way out of the rendered editor but closing the tab.
  customEditors.length = 0;
  configuration = {};
  activateBundle();

  const panel = renderPanel();
  panel.active = true;
  executed.length = 0;
  customEditors[0].provider.resolveCustomTextEditor(cmDocument, panel, {});
  assert.deepEqual(executed, [
    { command: 'setContext', args: ['chromamark.inRenderedEditor', true] },
  ]);

  // Focusing another tab clears it, and coming back sets it again.
  executed.length = 0;
  panel.active = false;
  panel.fireViewStateChange();
  assert.deepEqual(executed, [
    { command: 'setContext', args: ['chromamark.inRenderedEditor', false] },
  ]);

  executed.length = 0;
  panel.active = true;
  panel.fireViewStateChange();
  assert.deepEqual(executed, [
    { command: 'setContext', args: ['chromamark.inRenderedEditor', true] },
  ]);

  // Closing the editor must clear it too, or the exit icon outlives its tab.
  executed.length = 0;
  panel.fireDispose();
  assert.deepEqual(executed, [
    { command: 'setContext', args: ['chromamark.inRenderedEditor', false] },
  ]);
});

test('switching surfaces replaces the tab rather than piling up another one', async () => {
  configuration = {};
  activateBundle();

  const openTab = (input) => {
    const tab = { input };
    vscodeStub.window.tabGroups.activeTabGroup = { activeTab: tab, tabs: [tab] };
    vscodeStub.window.tabGroups.all = [vscodeStub.window.tabGroups.activeTabGroup];
    return tab;
  };

  // A Markdown file is edited through the same custom editor as a .cm file.
  const source = openTab({ uri: mdDocument.uri });
  executed.length = 0;
  closedTabs.length = 0;
  await registeredCommands.get('chromamark.toggleRenderedEditing')();
  assert.deepEqual(executed, [
    { command: 'vscode.openWith', args: [mdDocument.uri, 'chromamark.editableEditor'] },
  ]);
  assert.deepEqual(closedTabs, [source], 'the editor replaces the source tab it was opened from');

  // Leaving lands on the preview, not on the raw source it was opened from.
  const rendered = openTab({
    uri: mdDocument.uri,
    viewType: 'mainThreadCustomEditor-chromamark.editableEditor',
  });
  executed.length = 0;
  closedTabs.length = 0;
  await registeredCommands.get('chromamark.toggleRenderedEditing')();
  assert.deepEqual(executed, [
    { command: 'vscode.openWith', args: [mdDocument.uri, 'default'] },
    { command: 'markdown.reopenAsPreview', args: [] },
  ]);
  assert.deepEqual(closedTabs, [rendered]);

  vscodeStub.window.tabGroups.activeTabGroup = undefined;
  vscodeStub.window.tabGroups.all = [];
});

test('editing from a preview cleans up the source revealed to identify it', async () => {
  // The preview names no document, so its source has to be revealed to learn the
  // URI. That reveal is scaffolding: left open, entering the editor from a
  // preview would strand three tabs on one file.
  configuration = {};
  activateBundle();

  const preview = { input: { viewType: 'mainThreadWebview-markdown.preview' } };
  const group = { activeTab: preview, tabs: [preview] };
  vscodeStub.window.tabGroups.activeTabGroup = group;
  vscodeStub.window.tabGroups.all = [group];

  const revealed = { input: { uri: cmDocument.uri } };
  const origExecute = vscodeStub.commands.executeCommand;
  vscodeStub.commands.executeCommand = async (command, ...args) => {
    executed.push({ command, args });
    if (command === 'markdown.showSource') {
      group.tabs = [preview, revealed];
      group.activeTab = revealed;
      vscodeStub.window.activeTextEditor = { document: cmDocument };
    }
  };

  executed.length = 0;
  closedTabs.length = 0;
  try {
    await registeredCommands.get('chromamark.toggleRenderedEditing')();
  } finally {
    vscodeStub.commands.executeCommand = origExecute;
    vscodeStub.window.activeTextEditor = undefined;
    vscodeStub.window.tabGroups.activeTabGroup = undefined;
    vscodeStub.window.tabGroups.all = [];
  }

  assert.deepEqual(executed, [
    { command: 'markdown.showSource', args: [] },
    { command: 'vscode.openWith', args: [cmDocument.uri, 'chromamark.editableEditor'] },
  ]);
  assert.deepEqual(closedTabs, [preview, revealed], 'both the preview and its revealed source go');
});

