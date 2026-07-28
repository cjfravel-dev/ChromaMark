import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TARGETS } from './build-output-style.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const prompt = read('docs/agent-setup/prompt.md');

test('installer explains surface-aware emission and plain-GFM fallback', () => {
  assert.match(prompt, /prefer \*\*ChromaMark\*\*/i);
  assert.match(prompt, /superset of\s+GitHub-Flavored Markdown/i);
  assert.match(prompt, /fall back to plain GFM/i);
});

test('installer offers global (user-level) destinations', () => {
  for (const dest of [
    '~/.copilot/copilot-instructions.md',
    '~/.claude/CLAUDE.md',
    '~/.codeium/windsurf/memories/global_rules.md',
    '~/.codex/AGENTS.md',
  ]) {
    assert.ok(prompt.includes(dest), `installer must offer global destination ${dest}`);
  }
});

test('installer references every generated output-style file by raw URL', () => {
  for (const { name } of TARGETS) {
    const url = `https://raw.githubusercontent.com/cjfravel-dev/ChromaMark/main/.agents/output-style/${name}`;
    assert.ok(prompt.includes(url), `installer must fetch ${name}`);
  }
});

test('installer maps each host to a concrete destination and is idempotent', () => {
  for (const dest of [
    '.github/copilot-instructions.md',
    'CLAUDE.md',
    '.cursor/rules/chromamark.mdc',
    '.windsurf/rules/chromamark.md',
    'AGENTS.md',
  ]) {
    assert.ok(prompt.includes(dest), `installer must target ${dest}`);
  }
  assert.match(prompt, /chromamark:output-style:start/);
  assert.match(prompt, /chromamark:output-style:end/);
});

test('installer is self-verifying and published at a stable URL', () => {
  assert.match(prompt, /cjfravel-dev\.github\.io\/ChromaMark\/agent-setup\/prompt\.md/);
  const buildSite = read('scripts/build-site.mjs');
  assert.match(buildSite, /agent-setup\/prompt\.md/, 'build-site must publish the installer');
});
