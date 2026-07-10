import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, lint } from '@chromamark/renderer';
import { runEval, buildReport, main } from '../run.js';
import { mockProvider, providerFromSpec } from '../providers.js';
import { tasks } from '../tasks.js';
import { fixtures } from '../fixtures.js';

const system = 'SYSTEM PROMPT';

async function captureMain(args) {
  const stdout = process.stdout.write;
  const stderr = process.stderr.write;
  let out = '';
  let err = '';
  process.stdout.write = (chunk) => { out += chunk; return true; };
  process.stderr.write = (chunk) => { err += chunk; return true; };
  try {
    return { code: await main(args), stdout: out, stderr: err };
  } finally {
    process.stdout.write = stdout;
    process.stderr.write = stderr;
  }
}

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

test('eval rejects unknown task ids instead of producing an empty success report', async () => {
  const result = await captureMain(['--tasks', 'progress,not-real']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /unknown task "not-real"/);
  assert.equal(result.stdout, '');
});

test('eval rejects missing option values with an explicit argument error', async () => {
  for (const flag of ['--provider', '--tasks', '--system', '--fail-under']) {
    const result = await captureMain([flag]);
    assert.equal(result.code, 1, flag);
    assert.match(result.stderr, new RegExp(`option ${flag} requires a value`), flag);
  }
});

test('eval rejects invalid failure thresholds', async () => {
  for (const value of ['NaN', '-1', '101']) {
    const result = await captureMain(['--fail-under', value]);
    assert.equal(result.code, 1, value);
    assert.match(result.stderr, /--fail-under must be a number from 0 to 100/, value);
  }
});

test('eval reports invalid providers and system paths without throwing', async () => {
  const provider = await captureMain(['--provider', 'bogus']);
  assert.equal(provider.code, 1);
  assert.match(provider.stderr, /unknown provider "bogus"/);

  const systemPath = await captureMain(['--system', '/no/such/chromamark-system.txt']);
  assert.equal(systemPath.code, 1);
  assert.match(systemPath.stderr, /no such file or directory/i);
});
