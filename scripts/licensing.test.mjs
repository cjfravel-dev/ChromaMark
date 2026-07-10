import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('all distributed software packages declare the standard MIT license', () => {
  for (const path of [
    'package.json',
    'packages/renderer/package.json',
    'packages/cli/package.json',
    'packages/conformance/package.json',
    'packages/vscode/package.json',
  ]) {
    assert.equal(JSON.parse(read(path)).license, 'MIT', path);
  }
  const pyproject = read('packages/python/pyproject.toml');
  assert.match(pyproject, /^license = "MIT"$/m);
  assert.match(pyproject, /^license-files = \["LICENSE\.md"\]$/m);
  assert.doesNotMatch(pyproject, /License :: OSI Approved :: MIT License/);
});

test('every distributed software license contains the same standard MIT terms', () => {
  const paths = [
    'LICENSE.md',
    'packages/renderer/LICENSE.md',
    'packages/cli/LICENSE.md',
    'packages/conformance/LICENSE.md',
    'packages/python/LICENSE.md',
    'packages/vscode/LICENSE.md',
  ];
  const licenses = paths.map(read);
  for (let i = 1; i < licenses.length; i++) {
    assert.equal(licenses[i], licenses[0], `${paths[i]} must match LICENSE.md`);
  }
  assert.match(licenses[0], /^# MIT License/m);
  assert.match(licenses[0], /Copyright \(c\) 2026 CJ Fravel/);
  assert.match(licenses[0], /\(the "Software"\)/);
  assert.match(licenses[0], /THE SOFTWARE IS PROVIDED "AS IS"/);
  assert.doesNotMatch(licenses[0], /SaaS Provision/);
});

test('specification license defines CC BY-SA scope and upstream attribution', () => {
  const specLicense = read('LICENSE-SPEC.md');
  for (const path of [
    'SPEC.md',
    'docs/grammar.ebnf',
    'docs/llms.txt',
    'docs/compatibility.md',
  ]) {
    assert.match(specLicense, new RegExp(path.replace('.', '\\.')), path);
  }
  assert.match(specLicense, /CC BY-SA 4\.0/);
  assert.match(specLicense, /John MacFarlane/);
  assert.match(specLicense, /GitHub, Inc\./);
  assert.match(specLicense, /Changes from the upstream specifications/);
  assert.match(specLicense, /conformance corpus.*intentionally licensed under MIT/is);
});

test('repository and contribution docs explain the code/spec license split', () => {
  const readme = read('README.md');
  assert.match(readme, /software.*MIT/is);
  assert.match(readme, /specification.*CC BY-SA 4\.0/is);
  assert.match(readme, /license-MIT/);
  assert.match(readme, /spec-CC(?:%20|_)BY--SA(?:%20|_)4\.0/);

  const contributing = read('CONTRIBUTING.md');
  assert.match(contributing, /code contributions.*MIT/is);
  assert.match(contributing, /specification contributions.*CC BY-SA 4\.0/is);
});

test('bundled distributions ship complete third-party notices', () => {
  const requiredNotices = [
    /Copyright \(c\) 2014 Vitaly Puzrin, Alex Kocharin/,
    /Copyright \(c\) 2015 Vitaly Puzrin/,
    /Copyright Mathias Bynens/,
    /Copyright \(c\) Felix Böhm/,
  ];
  for (const path of [
    'packages/renderer/THIRD_PARTY_NOTICES.md',
    'packages/vscode/THIRD_PARTY_NOTICES.md',
  ]) {
    const notices = read(path);
    for (const expected of requiredNotices) assert.match(notices, expected, path);
  }

  const renderer = JSON.parse(read('packages/renderer/package.json'));
  assert.ok(renderer.files.includes('THIRD_PARTY_NOTICES.md'));
  assert.doesNotMatch(read('packages/vscode/.vscodeignore'), /^THIRD_PARTY_NOTICES\.md$/m);
});

test('citation metadata preserves project and author attribution', () => {
  const citation = read('CITATION.cff');
  assert.match(citation, /^title: ChromaMark$/m);
  assert.match(citation, /given-names: CJ/);
  assert.match(citation, /family-names: Fravel/);
  assert.match(citation, /^license: MIT$/m);
  assert.match(citation, /github\.com\/cjfravel-dev\/ChromaMark/);
});
