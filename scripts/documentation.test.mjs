import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('development docs cover deterministic setup and every quality gate', () => {
  const readme = read('README.md');
  assert.match(readme, /npm ci/);
  assert.match(readme, /npm run lint/);
  assert.match(readme, /ruff check/);
  assert.match(readme, /npm run coverage/);
  assert.match(readme, /\[Contributing\]\(\.\/CONTRIBUTING\.md\)/);
});

test('README.md is generated from the canonical ChromaMark source', () => {
  const source = read('README.cm');
  const generated = read('README.md');

  assert.match(source, /::: info Why ChromaMark/);
  assert.match(source, /::: info GitHub-native approximation/);
  assert.match(source, /transpiled[\s\S]*approximation[\s\S]*full ChromaMark experience[\s\S]*playground/i);
  assert.match(source, /::: success Deploy succeeded/);
  assert.match(generated, /^<!-- Generated from README\.cm/m);
  assert.doesNotMatch(generated, /^::: info Why ChromaMark/m);
  assert.match(generated, /> \[!NOTE\]/);
  assert.match(generated, /\*\*GitHub-native approximation\*\*/);
  assert.match(generated, /transpiled[\s\S]*approximation[\s\S]*full ChromaMark experience[\s\S]*playground/i);
  assert.match(generated, /✅ <kbd>healthy<\/kbd>/);
});

test('contributor guide requires the repository test-first workflow', () => {
  const contributing = read('CONTRIBUTING.md');
  assert.match(contributing, /^# Contributing to ChromaMark/m);
  assert.match(contributing, /^## Test-first workflow/m);
  assert.match(contributing, /confirm that it\s+fails/i);
  assert.match(contributing, /conformance\/cases\.json/);
});

test('changelog records the completed hardening work', () => {
  const changelog = read('CHANGELOG.md');
  assert.match(changelog, /^## \[Unreleased\]/m);
  for (let pr = 34; pr <= 40; pr++) {
    assert.match(changelog, new RegExp(`#${pr}\\b`));
  }
});

test('release guide distinguishes automated and manual publishing', () => {
  const releasing = read('docs/releasing.md');
  assert.match(releasing, /OIDC Trusted Publishing/);
  assert.match(releasing, /npm and PyPI/);
  assert.match(releasing, /VS Code Marketplace/);
  assert.match(releasing, /GitHub Release/);
  assert.match(releasing, /root `package\.json`/);
  assert.match(releasing, /regenerate `package-lock\.json`/);
});

test('surface docs describe newly enforced behavior', () => {
  const renderer = read('packages/renderer/README.md');
  const cli = read('packages/cli/README.md');
  assert.match(renderer, /role="progressbar"/);
  assert.match(renderer, /renderGitHub/);
  assert.match(cli, /extra positional arguments/i);
  assert.match(cli, /chromamark github/);
  assert.match(read('packages/python/README.md'), /chromamark lint/);
  assert.match(read('eval/README.md'), /unknown task IDs/);
  assert.match(read('packages/vscode/README.md'), /live lint diagnostics/i);
  assert.match(read('packages/vscode/README.md'), /quick fixes/i);
});

test('all specification companions describe the renderer-controlled HTML policy', () => {
  const compatibility = read('docs/compatibility.md');
  const grammar = read('docs/grammar.ebnf');
  const notebook = read('packages/python/examples/chromamark_report.ipynb');

  assert.match(compatibility, /Raw HTML follows the host\s+renderer's policy/);
  assert.match(compatibility, /reference convenience\s+renderers disable raw HTML by default/);
  assert.match(grammar, /Raw HTML handling is a renderer policy/);
  assert.match(notebook, /strict syntax superset of/);
  assert.doesNotMatch(notebook, /a strict superset of/);
});

test('security policy routes vulnerability reports through GitHub privately', () => {
  const security = read('SECURITY.md');
  assert.match(security, /^# Security policy/m);
  assert.match(security, /^## Supported versions/m);
  assert.match(security, /security\/advisories\/new/);
  assert.match(security, /Do not open a public issue/);
  assert.match(read('README.md'), /\[Security\]\(\.\/SECURITY\.md\)/);
});
