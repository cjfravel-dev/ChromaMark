import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreOutput, extractChromaMark, usedConstructs } from '../score.js';

const deployTask = { id: 'deploy', requires: ['block', 'fields', 'pill'] };

const goodDeploy = `::: success Deploy succeeded
::: fields
Region: eastus
Replicas: 3/3 [!ok healthy]
:::
:::`;

const backtickPill = 'Build `[!pass]` done'; // pill wrapped in backticks (CM001)

const onlyPill = 'Build [!pass]'; // valid but missing block + fields

test('extractChromaMark unwraps a fenced ```chromamark block', () => {
  const wrapped = '```chromamark\n::: success\nhi [!ok yes]\n:::\n```';
  assert.equal(extractChromaMark(wrapped), '::: success\nhi [!ok yes]\n:::');
  assert.equal(extractChromaMark('no fence [!pass]'), 'no fence [!pass]');
});

test('usedConstructs detects rendered construct kinds', () => {
  const used = usedConstructs('::: success\n[!ok x] and [=info 50%]\n:::');
  assert.ok(used.includes('block'));
  assert.ok(used.includes('pill'));
  assert.ok(used.includes('meter'));
  assert.ok(!used.includes('details'));
});

test('a correct answer passes: valid and uses every required construct', () => {
  const s = scoreOutput(goodDeploy, deployTask);
  assert.equal(s.valid, true);
  assert.deepEqual(s.missing, []);
  assert.equal(s.pass, true);
  assert.deepEqual(s.diagnostics, []);
});

test('a backtick-wrapped pill is invalid (fails on lint)', () => {
  const s = scoreOutput(backtickPill, deployTask);
  assert.equal(s.valid, false);
  assert.ok(s.diagnostics.some((d) => d.rule === 'CM001'));
  assert.equal(s.pass, false);
});

test('a valid answer that omits required constructs does not pass', () => {
  const s = scoreOutput(onlyPill, deployTask);
  assert.equal(s.valid, true);
  assert.deepEqual(s.missing.sort(), ['block', 'fields']);
  assert.equal(s.pass, false);
});
