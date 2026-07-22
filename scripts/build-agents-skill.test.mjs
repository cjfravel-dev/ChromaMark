import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderSkill, SKILL_PATH, LLMS_PATH } from './build-agents-skill.mjs';

const llms = readFileSync(LLMS_PATH, 'utf8');

test('rendered skill carries discoverable frontmatter', () => {
  const skill = renderSkill(llms);
  assert.match(skill, /^---\n/);
  assert.match(skill, /\nname: chromamark-authoring\n/);
  assert.match(skill, /\ndescription:/);
  assert.match(skill.split('---')[1], /ChromaMark/);
});

test('rendered skill teaches authoring plus a validation workflow', () => {
  const skill = renderSkill(llms);
  assert.match(skill, /\.cm/);
  assert.match(skill, /chromamark lint/);
  assert.match(skill, /Colored blocks/, 'embeds the llms.txt authoring reference');
});

test('committed skill file is in sync with docs/llms.txt', () => {
  const committed = readFileSync(SKILL_PATH, 'utf8');
  assert.equal(committed, renderSkill(llms), 'run `npm run build:agents` to regenerate');
});
