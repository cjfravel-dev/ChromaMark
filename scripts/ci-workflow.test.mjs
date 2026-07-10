import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const pagesWorkflow = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
const publishWorkflow = readFileSync(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8');
const gitignore = readFileSync(new URL('../.gitignore', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const pyproject = readFileSync(new URL('../packages/python/pyproject.toml', import.meta.url), 'utf8');

function job(name, nextName) {
  const end = nextName ? `\\n  ${nextName}:` : '$';
  const match = new RegExp(`\\n  ${name}:([\\s\\S]*?)${end}`).exec(workflow);
  assert.ok(match, `CI workflow must define the ${name} job`);
  return match[1];
}

test('renderer CI covers the oldest and current supported Node versions', () => {
  const renderer = job('renderer', 'python');
  assert.match(renderer, /node-version:\s*\[18,\s*24\]/);
  assert.match(renderer, /node-version:\s*\$\{\{\s*matrix\.node-version\s*\}\}/);
  assert.match(renderer, /run:\s*npm run test:scripts/);
});

test('Python CI covers the oldest, representative, and current versions', () => {
  const python = job('python', 'coverage');
  assert.match(python, /python-version:\s*\["3\.9",\s*"3\.12",\s*"3\.14"\]/);
  assert.match(python, /python-version:\s*\$\{\{\s*matrix\.python-version\s*\}\}/);
});

test('workflows use the committed npm lockfile for deterministic installs', () => {
  for (const [name, source] of [
    ['CI', workflow],
    ['Pages', pagesWorkflow],
    ['Publish', publishWorkflow],
  ]) {
    assert.doesNotMatch(source, /run:\s*npm install --no-audit --no-fund/, `${name} must not use npm install`);
    assert.match(source, /run:\s*npm ci --no-audit --no-fund/, `${name} must use npm ci`);
  }
  assert.doesNotMatch(gitignore, /^package-lock\.json$/m);
});

test('renderer CI rejects stale generated artifacts and theme copies', () => {
  const renderer = job('renderer', 'python');
  assert.match(
    renderer,
    /npm run build --workspace @chromamark\/renderer[\s\S]*git diff --exit-code -- packages\/renderer\/dist/,
  );
  assert.match(
    renderer,
    /cmp packages\/renderer\/theme\/chromamark\.css packages\/python\/src\/chromamark\/theme\.css/,
  );
});

test('renderer CI rejects a stale generated GitHub README', () => {
  assert.match(workflow, /npm run build:readme -- --check/);
});

test('CI runs the repository static quality gates', () => {
  const renderer = job('renderer', 'python');
  const python = job('python', 'coverage');
  assert.equal(packageJson.scripts.lint, 'eslint .');
  assert.match(renderer, /run:\s*npm run lint/);
  assert.match(pyproject, /test\s*=\s*\[[^\]]*"ruff>=/);
  assert.match(pyproject, /\[tool\.ruff\]/);
  assert.match(python, /ruff check src tests/);
});
