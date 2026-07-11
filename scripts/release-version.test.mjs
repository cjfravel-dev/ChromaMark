import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function json(path) {
  return JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
}

function text(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('v0.4.2 coordinated package versions are aligned', () => {
  const root = json('package.json');
  const renderer = json('packages/renderer/package.json');
  const cli = json('packages/cli/package.json');
  const conformance = json('packages/conformance/package.json');
  const vscode = json('packages/vscode/package.json');

  assert.equal(root.version, '0.4.2');
  assert.equal(renderer.version, '0.4.2');
  assert.equal(cli.version, '0.3.0');
  assert.equal(conformance.version, '0.1.2');
  assert.equal(vscode.version, '0.2.3');
  assert.equal(cli.dependencies['@chromamark/renderer'], '^0.4.0');
  assert.equal(vscode.dependencies['@chromamark/renderer'], '^0.4.2');

  const pyproject = text('packages/python/pyproject.toml');
  assert.match(pyproject, /^version = "0\.2\.2"$/m);
  assert.match(text('packages/python/src/chromamark/__init__.py'), /^__version__ = "0\.2\.2"$/m);
});

test('package lock records every coordinated npm version', () => {
  const lock = json('package-lock.json');
  assert.equal(lock.version, '0.4.2');
  assert.equal(lock.packages[''].version, '0.4.2');
  assert.equal(lock.packages['packages/renderer'].version, '0.4.2');
  assert.equal(lock.packages['packages/cli'].version, '0.3.0');
  assert.equal(lock.packages['packages/conformance'].version, '0.1.2');
  assert.equal(lock.packages['packages/vscode'].version, '0.2.3');
});

test('changelog contains the VS Code v0.2.3 release', () => {
  assert.match(text('CHANGELOG.md'), /^## \[VS Code 0\.2\.3\] - 2026-07-11$/m);
});

test('changelog contains the coordinated v0.4.2 release', () => {
  const changelog = text('CHANGELOG.md');
  assert.match(changelog, /^## \[0\.4\.2\] - 2026-07-10$/m);
  assert.match(changelog, /^\[0\.4\.2\]: .*\/releases\/tag\/v0\.4\.2$/m);
});
