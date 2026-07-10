import { test } from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const distPath = fileURLToPath(new URL('../dist/extension.js', import.meta.url));

const diagnostics = [];
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
  languages: {
    createDiagnosticCollection: () => ({
      set: (uri, values) => diagnostics.push({ uri, values }),
      delete: () => {},
      dispose() {},
    }),
  },
  workspace: {
    textDocuments: [cmDocument, mdDocument, remoteCmDocument],
    onDidOpenTextDocument: () => ({ dispose() {} }),
    onDidChangeTextDocument: () => ({ dispose() {} }),
    onDidCloseTextDocument: () => ({ dispose() {} }),
    getConfiguration: () => ({ get: () => undefined }),
  },
  window: {
    activeTextEditor: undefined,
    onDidChangeActiveTextEditor: () => ({ dispose() {} }),
    tabGroups: { all: [], onDidChangeTabs: () => ({ dispose() {} }) },
  },
  commands: { executeCommand: async () => {}, registerCommand: () => ({ dispose() {} }) },
};

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
});
