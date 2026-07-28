import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  renderOutputStyle, renderBody, TARGETS, LLMS_PATH,
} from './build-output-style.mjs';

const llms = readFileSync(LLMS_PATH, 'utf8');

test('the directive makes ChromaMark the default and states the degradation contract', () => {
  const body = renderBody(llms);
  assert.match(body, /by default/i);
  assert.match(body, /superset of\s+GitHub-Flavored Markdown/i, 'explains it is safe to emit anywhere');
  assert.match(body, /degrades/i);
});

test('the directive embeds the llms.txt syntax reference', () => {
  const body = renderBody(llms);
  assert.match(body, /## ChromaMark syntax/);
  assert.match(body, /Colored blocks/);
  assert.match(body, /pill\/badge/);
});

test('cursor and windsurf carry always-on frontmatter, plain hosts do not', () => {
  const out = renderOutputStyle(llms);
  assert.match(out['cursor.mdc'], /^---\n[\s\S]*alwaysApply: true\n---/);
  assert.match(out['windsurf.md'], /^---\ntrigger: always_on\n---/);
  assert.doesNotMatch(out['AGENTS.md'], /^---/);
  assert.doesNotMatch(out['copilot-instructions.md'], /^---/);
  assert.doesNotMatch(out['CLAUDE.md'], /^---/);
});

test('committed output-style files are in sync with docs/llms.txt', () => {
  const rendered = renderOutputStyle(llms);
  for (const { name, path } of TARGETS) {
    const committed = readFileSync(path, 'utf8');
    assert.equal(committed, rendered[name], `run \`npm run build:output-style\` to regenerate ${name}`);
  }
});
