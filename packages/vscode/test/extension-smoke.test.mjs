import { test } from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const distPath = fileURLToPath(new URL('../dist/extension.js', import.meta.url));

const vscodeStub = {
  window: {
    activeTextEditor: undefined,
    onDidChangeActiveTextEditor: () => ({ dispose() {} }),
    tabGroups: { all: [], onDidChangeTabs: () => ({ dispose() {} }) },
  },
  commands: { executeCommand: async () => {} },
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
});
