import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

function packageJson(path) {
  return JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
}

test('npm packages map every public JavaScript entry to declarations', () => {
  const renderer = packageJson('packages/renderer/package.json');
  const cli = packageJson('packages/cli/package.json');
  const conformance = packageJson('packages/conformance/package.json');

  assert.equal(renderer.types, './src/index.d.ts');
  assert.equal(renderer.exports['.'].types, './src/index.d.ts');
  assert.equal(renderer.exports['./browser'].types, './src/browser.d.ts');
  assert.equal(renderer.exports['./browser-slim'].types, './src/browser-slim.d.ts');
  assert.equal(cli.types, './src/index.d.ts');
  assert.equal(cli.exports['.'].types, './src/index.d.ts');
  assert.equal(conformance.types, './src/index.d.ts');
  assert.equal(conformance.exports['.'].types, './src/index.d.ts');

  for (const path of [
    'packages/renderer/src/index.d.ts',
    'packages/renderer/src/browser.d.ts',
    'packages/renderer/src/browser-slim.d.ts',
    'packages/cli/src/index.d.ts',
    'packages/conformance/src/index.d.ts',
  ]) {
    assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), path);
  }
});

test('public TypeScript declarations compile under strict NodeNext resolution', () => {
  const tsc = fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url));
  const fixture = fileURLToPath(new URL('./fixtures/typescript-smoke.mts', import.meta.url));
  const result = spawnSync(
    process.execPath,
    [
      tsc,
      '--noEmit',
      '--strict',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2022',
      fixture,
    ],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
