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
    tabGroups: { all: [], onDidChangeTabs: () => ({ dispose() {} }) },
    registerCustomEditorProvider: (viewType, provider, options) => {
      customEditors.push({ viewType, provider, options });
      return { dispose() {} };
    },
  },
  commands: { executeCommand: async () => {}, registerCommand: () => ({ dispose() {} }) },
};

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
    return require(distPath).activate({ subscriptions: [], extensionUri: { path: '/ext' } });
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

test('the experimental editor stays unregistered until the setting opts in', () => {
  customEditors.length = 0;
  configuration = {};
  activateBundle();
  assert.equal(customEditors.length, 0, 'the Markdown preview must stay the only rendered view by default');

  configuration = { 'experimental.editableEditor': true };
  activateBundle();
  assert.equal(customEditors.length, 1);
  assert.equal(customEditors[0].viewType, 'chromamark.editableEditor');
  assert.equal(typeof customEditors[0].provider.resolveCustomTextEditor, 'function');
});

test('the editor webview forbids inline script and allows only a per-load nonce', () => {
  // The webview assigns rendered HTML to innerHTML, which is only safe because
  // nothing inline can run. Escaping is pinned in editable-editor.test.mjs.
  customEditors.length = 0;
  configuration = { 'experimental.editableEditor': true };
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
