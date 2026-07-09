import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, lint } from '@chromamark/renderer';
import { runEval, buildReport } from '../run.js';
import { mockProvider, providerFromSpec } from '../providers.js';
import { tasks } from '../tasks.js';
import { fixtures } from '../fixtures.js';

const system = 'SYSTEM PROMPT';

test('a full mock run scores 4/5 (the backtick-pill fixture fails)', async () => {
  const { rows, byProvider } = await runEval({ providers: [mockProvider(fixtures)], tasks, system });
  assert.equal(rows.length, tasks.length);
  assert.equal(byProvider[0].total, 5);
  assert.equal(byProvider[0].pass, 4);
  const releaseNote = rows.find((r) => r.id === 'release-note');
  assert.equal(releaseNote.pass, false);
  assert.ok(releaseNote.diagnostics.some((d) => d.rule === 'CM001'));
});

test('the report is itself valid ChromaMark and lists failures', async () => {
  const result = await runEval({ providers: [mockProvider(fixtures)], tasks, system });
  const report = buildReport(result);
  assert.match(report, /LLM-conformance eval/);
  assert.match(report, /release-note/);
  assert.equal(lint(report).length, 0, 'the report should be lint-clean ChromaMark');
  assert.match(render(report), /class="cm-block/);
});

test('provider errors are captured as failed rows, not thrown', async () => {
  const boom = { name: 'boom', async complete() { throw new Error('network down'); } };
  const { byProvider, rows } = await runEval({ providers: [boom], tasks, system });
  assert.equal(byProvider[0].pass, 0);
  assert.ok(rows.every((r) => r.error === 'network down'));
});

test('providerFromSpec builds providers and rejects unknown specs', () => {
  assert.equal(providerFromSpec('mock', { fixtures }).name, 'mock');
  assert.equal(providerFromSpec('openai:gpt-4o').name, 'openai:gpt-4o');
  assert.equal(providerFromSpec('anthropic').name, 'anthropic:claude-3-5-sonnet-latest');
  assert.throws(() => providerFromSpec('bogus'));
});
