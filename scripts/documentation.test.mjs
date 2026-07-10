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
  assert.match(read('packages/renderer/README.md'), /role="progressbar"/);
  assert.match(read('packages/cli/README.md'), /extra positional arguments/i);
  assert.match(read('eval/README.md'), /unknown task IDs/);
});

test('security policy routes vulnerability reports through GitHub privately', () => {
  const security = read('SECURITY.md');
  assert.match(security, /^# Security policy/m);
  assert.match(security, /^## Supported versions/m);
  assert.match(security, /security\/advisories\/new/);
  assert.match(security, /Do not open a public issue/);
  assert.match(read('README.md'), /\[Security\]\(\.\/SECURITY\.md\)/);
});
