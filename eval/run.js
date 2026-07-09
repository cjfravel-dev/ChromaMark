/**
 * ChromaMark LLM-conformance eval runner. Prompts each provider with docs/llms.txt
 * as the system prompt and every task instruction, scores the answers with the
 * real linter + renderer, and prints a ChromaMark report.
 *
 *   node eval/run.js                         # offline mock demo
 *   node eval/run.js --provider openai:gpt-4o --provider anthropic
 *   node eval/run.js --tasks deploy-report,progress --fail-under 80
 *
 * Pipe the report through the renderer for a colored terminal view:
 *   node eval/run.js | npx @chromamark/cli render
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tasks as ALL_TASKS } from './tasks.js';
import { fixtures } from './fixtures.js';
import { scoreOutput } from './score.js';
import { providerFromSpec } from './providers.js';

const LLMS_TXT = fileURLToPath(new URL('../docs/llms.txt', import.meta.url));

/** Run every provider against every task and score the answers. */
export async function runEval({ providers, tasks, system }) {
  const rows = [];
  for (const provider of providers) {
    for (const task of tasks) {
      let row;
      try {
        const output = await provider.complete(system, task.instruction, { task });
        row = { provider: provider.name, ...scoreOutput(output, task) };
      } catch (err) {
        row = { provider: provider.name, id: task.id, valid: false, pass: false, missing: [], diagnostics: [], error: err.message };
      }
      rows.push(row);
    }
  }
  const byProvider = providers.map((p) => {
    const mine = rows.filter((r) => r.provider === p.name);
    const pass = mine.filter((r) => r.pass).length;
    const valid = mine.filter((r) => r.valid).length;
    return { name: p.name, total: mine.length, pass, valid, rate: mine.length ? (pass / mine.length) * 100 : 0 };
  });
  return { rows, byProvider };
}

function rateMeter(rate) {
  const tone = rate >= 100 ? 'success' : rate >= 50 ? 'warning' : 'danger';
  return `[=${tone} ${Math.round(rate)}%]`;
}

/** Render the results as a ChromaMark report. */
export function buildReport({ rows, byProvider }) {
  const lines = [];
  lines.push('# ChromaMark LLM-conformance eval', '');
  lines.push('::: info What this measures');
  lines.push('How reliably each model emits **valid** ChromaMark (no lint problems) that');
  lines.push('**uses the requested constructs**, prompted only with `docs/llms.txt`.');
  lines.push(':::', '');

  lines.push('| Provider | Pass | Valid | Rate |', '| --- | --- | --- | --- |');
  for (const p of byProvider) {
    lines.push(`| ${p.name} | ${p.pass}/${p.total} | ${p.valid}/${p.total} | ${rateMeter(p.rate)} |`);
  }
  lines.push('');

  const failures = rows.filter((r) => !r.pass);
  if (failures.length) {
    lines.push(`::: details danger Failures (${failures.length})`);
    for (const f of failures) {
      const why = f.error
        ? `error: ${f.error}`
        : [
            f.diagnostics.length ? `invalid: ${f.diagnostics.map((d) => d.rule).join(', ')}` : null,
            f.missing.length ? `missing: ${f.missing.join(', ')}` : null,
          ].filter(Boolean).join(' · ') || 'unknown';
      lines.push(`- **${f.id}** · ${f.provider} — ${why}`);
    }
    lines.push(':::', '');
  } else {
    lines.push('::: success All answers passed', 'Every provider produced valid ChromaMark using the requested constructs.', ':::', '');
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const opts = { providers: [], tasks: null, system: LLMS_TXT, json: false, failUnder: 0 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--provider') opts.providers.push(argv[++i]);
    else if (a === '--tasks') opts.tasks = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--system') opts.system = argv[++i];
    else if (a === '--json') opts.json = true;
    else if (a === '--fail-under') opts.failUnder = Number(argv[++i]);
    else if (a === '-h' || a === '--help') opts.help = true;
    else throw new Error(`unknown option: ${a}`);
  }
  if (!opts.providers.length) opts.providers = ['mock'];
  return opts;
}

const HELP = `chromamark eval — measure how reliably models emit valid ChromaMark

Usage:
  node eval/run.js [--provider <spec>]... [--tasks a,b] [--fail-under <pct>] [--json]

Providers (repeatable; default: mock):
  mock                 offline replay of canned answers (no network)
  openai[:model]       OpenAI-compatible API  (OPENAI_API_KEY [, OPENAI_BASE_URL])
  anthropic[:model]    Anthropic Messages API (ANTHROPIC_API_KEY)

Options:
  --tasks <ids>        comma-separated task ids to run (default: all)
  --system <path>      system prompt file (default: docs/llms.txt)
  --fail-under <pct>   exit non-zero if any provider's pass rate is below <pct>
  --json               print raw JSON results instead of the ChromaMark report
`;

export async function main(argv = process.argv.slice(2)) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    process.stderr.write(`${err.message}\n\n${HELP}`);
    return 1;
  }
  if (opts.help) { process.stdout.write(HELP); return 0; }

  const system = readFileSync(opts.system, 'utf8');
  const tasks = opts.tasks ? ALL_TASKS.filter((t) => opts.tasks.includes(t.id)) : ALL_TASKS;
  const providers = opts.providers.map((s) => providerFromSpec(s, { fixtures }));

  const result = await runEval({ providers, tasks, system });
  if (opts.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`${buildReport(result)}\n`);
  }
  const worst = Math.min(...result.byProvider.map((p) => p.rate));
  return opts.failUnder && worst < opts.failUnder ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().then((code) => { if (code) process.exit(code); });
}
