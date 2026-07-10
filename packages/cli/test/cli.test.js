import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compile, render, renderGitHub, theme,
} from '../src/index.js';
import { run } from '../src/cli.js';

const BIN = fileURLToPath(new URL('../bin/chromamark.js', import.meta.url));

async function waitFor(predicate, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

test('run() returns 1 for a missing input without throwing', () => {
  const err = process.stderr.write;
  process.stderr.write = () => true; // silence expected error output
  try {
    assert.equal(run(['/no/such/file-xyz.cm']), 1);
  } finally {
    process.stderr.write = err;
  }
});

test('compile produces a self-contained HTML page', () => {
  const html = compile('::: success\nAll good [!pass]\n:::', { title: 'Report' });
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /<title>Report<\/title>/);
  assert.match(html, /<div class="cm-block" data-tone="success">/);
  assert.match(html, /class="cm-pill" data-tone="success"/);
  assert.match(html, /\.cm-block\s*\{/, 'theme is inlined');
  assert.doesNotMatch(html, /https?:\/\/cdn/, 'no CDN reference');
  assert.doesNotMatch(html, /<script src=/, 'no external scripts');
});

test('render returns just a fragment', () => {
  assert.match(render('[!pass]'), /cm-pill/);
  assert.doesNotMatch(render('[!pass]'), /<!DOCTYPE/);
});

test('renderGitHub returns GitHub-native GFM', () => {
  assert.equal(
    renderGitHub('::: success Deploy\nAll good [!pass]\n:::'),
    '> [!TIP]\n> **Deploy**\n>\n> All good ✅ <kbd>PASS</kbd>\n',
  );
});

test('theme returns the stylesheet', () => {
  assert.match(theme(), /--cm-success-fg/);
});

test('CLI builds a file to a default .html path', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'report.cm');
  writeFileSync(input, '::: info\nhi [!ok yes]\n:::\n');
  execFileSync(process.execPath, [BIN, 'build', input]);
  const out = join(dir, 'report.html');
  assert.ok(existsSync(out));
  assert.match(readFileSync(out, 'utf8'), /<div class="cm-block" data-tone="info">/);
});

test('CLI honors -o and writes to stdout with --stdout', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'a.cm');
  const output = join(dir, 'custom.html');
  writeFileSync(input, '::: success\nok\n:::\n');
  execFileSync(process.execPath, [BIN, input, '-o', output]);
  assert.ok(existsSync(output));
  const stdout = execFileSync(process.execPath, [BIN, input, '--stdout'], { encoding: 'utf8' });
  assert.match(stdout, /cm-block/);
});

test('CLI reads from stdin when input is -', () => {
  const stdout = execFileSync(process.execPath, [BIN, '-'], {
    input: '[!pass]\n',
    encoding: 'utf8',
  });
  assert.match(stdout, /cm-pill/);
});

test('CLI builds a directory of .cm files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const outdir = join(dir, 'out');
  writeFileSync(join(dir, 'one.cm'), '::: success\nx\n:::\n');
  writeFileSync(join(dir, 'two.cm'), '::: danger\ny\n:::\n');
  execFileSync(process.execPath, [BIN, 'build', dir, '-o', outdir]);
  assert.ok(existsSync(join(outdir, 'one.html')));
  assert.ok(existsSync(join(outdir, 'two.html')));
});

test('CLI --watch rebuilds on change', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-watch-'));
  const input = join(dir, 'w.cm');
  const output = join(dir, 'w.html');
  writeFileSync(input, '::: info\nfirst version\n:::\n');
  const child = spawn(process.execPath, [BIN, input, '--watch', '-o', output], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  try {
    const built = await waitFor(
      () =>
        existsSync(output) &&
        readFileSync(output, 'utf8').includes('first version') &&
        stderr.includes('watching for changes') &&
        stderr.includes(`built ${output}`),
      4000,
    );
    assert.ok(built, 'initial build did not happen');
    assert.ok(
      stderr.indexOf('watching for changes') < stderr.indexOf(`built ${output}`),
      'watcher must be ready before the initial build is reported',
    );
    writeFileSync(input, '::: success\nsecond version\n:::\n');
    const rebuilt = await waitFor(() => readFileSync(output, 'utf8').includes('second version'), 4000);
    assert.ok(rebuilt, 'watch did not rebuild on change');
  } finally {
    child.kill();
  }
});

test('directory watch ignores generated HTML inside the input tree', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-watch-tree-'));
  const output = join(dir, 'site');
  writeFileSync(join(dir, 'one.cm'), '[!pass]\n');
  const child = spawn(process.execPath, [BIN, dir, '--watch', '-o', output], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  try {
    assert.ok(
      await waitFor(() => existsSync(join(output, 'one.html')), 4000),
      'initial directory build did not happen',
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    const builds = stderr.match(/built 1 file\(s\) into/g) || [];
    assert.equal(builds.length, 1, `generated output retriggered the watcher:\n${stderr}`);
  } finally {
    child.kill();
  }
});

test('run() closes its watcher when the initial watched build fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-watch-fail-'));
  const blockedOutput = join(dir, 'blocked');
  writeFileSync(join(dir, 'one.cm'), '[!pass]\n');
  writeFileSync(blockedOutput, 'not a directory');
  const script = [
    "import { run } from './packages/cli/src/cli.js';",
    `process.exitCode = run(${JSON.stringify([dir, '--watch', '-o', blockedOutput])});`,
  ].join('\n');
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: fileURLToPath(new URL('../../..', import.meta.url)),
    encoding: 'utf8',
    timeout: 2000,
  });
  assert.equal(result.signal, null, 'run() leaked the watcher after the failed build');
  assert.equal(result.status, 1);
});

test('parseArgs rejects -o/--title that would swallow the next flag', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const cm = join(dir, 'a.cm');
  writeFileSync(cm, '::: success\nhi\n:::\n');
  const err = process.stderr.write;
  const cwd = process.cwd();
  process.stderr.write = () => true;
  process.chdir(dir);
  try {
    assert.equal(run([cm, '-o', '--watch']), 1, '-o must reject a following flag');
    assert.equal(run([cm, '--title', '--stdout']), 1, '--title must reject a following flag');
    assert.equal(run([cm, '-o']), 1, 'trailing -o with no value must error');
  } finally {
    process.chdir(cwd);
    process.stderr.write = err;
  }
});

test('CLI rejects extra positional arguments instead of ignoring them', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'a.cm');
  writeFileSync(input, '[!pass]\n');
  const { code } = runCapture([input, 'extra.cm', '--stdout']);
  assert.equal(code, 1);
  assert.equal(runCapture([input, '-', '--stdout']).code, 1);
});

test('CLI errors (exit 1) on empty stdin with no input arg and no explicit -', () => {
  assert.throws(() => execFileSync(BIN, [], { input: '' }));
});

test('CLI still reads explicit - from stdin', () => {
  const out = execFileSync(BIN, ['-'], { input: '::: success\nhi\n:::\n', encoding: 'utf8' });
  assert.match(out, /<div class="cm-block" data-tone="success">/);
});

test('CLI render outputs ANSI-styled terminal text', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'r.cm');
  writeFileSync(input, '::: success Deploy\nAll good [!ok healthy]\n:::\n');
  const out = execFileSync(process.execPath, [BIN, 'render', input, '--color', 'always'], { encoding: 'utf8' });
  assert.match(out, /\x1b\[/, 'expected ANSI escape sequences');
  assert.match(out, /✓ Deploy/);
  assert.match(out, /healthy/);
});

test('CLI render --no-color emits plain, legible text', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'r.cm');
  writeFileSync(input, 'Build [!pass]\n');
  const out = execFileSync(process.execPath, [BIN, 'render', input, '--no-color'], { encoding: 'utf8' });
  assert.doesNotMatch(out, /\x1b/);
  assert.match(out, /\[✓ PASS\]/);
});

test('CLI render reads ChromaMark from stdin', () => {
  const out = execFileSync(process.execPath, [BIN, 'render', '--color', 'never'], {
    input: '[!fail 3]\n', encoding: 'utf8',
  });
  assert.match(out, /\[✗ 3\]/);
});

test('CLI github renders a file to GitHub-native GFM', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'report.cm');
  writeFileSync(input, '::: warning Review\nNeeds attention [!warn P1]\n:::\n');
  const out = execFileSync(process.execPath, [BIN, 'github', input], { encoding: 'utf8' });
  assert.match(out, /^> \[!WARNING\]/m);
  assert.match(out, /⚠️ <kbd>P1<\/kbd>/);
});

test('CLI github reads stdin and can write an output file', () => {
  const stdinOut = execFileSync(process.execPath, [BIN, 'github'], {
    input: '::: fields\nStatus: [!ok ready]\n:::\n',
    encoding: 'utf8',
  });
  assert.match(stdinOut, /\| Status \| ✅ <kbd>ready<\/kbd> \|/);

  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'report.cm');
  const output = join(dir, 'report.md');
  writeFileSync(input, '::: info\nhello\n:::\n');
  execFileSync(process.execPath, [BIN, 'github', input, '-o', output]);
  assert.match(readFileSync(output, 'utf8'), /^> \[!NOTE\]/m);
});

test('CLI github rejects unsupported command-specific options', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'report.cm');
  writeFileSync(input, '[!pass]\n');

  for (const args of [
    ['--watch'],
    ['--title', 'Report'],
    ['--color', 'always'],
    ['--disable', 'CM001'],
  ]) {
    const result = spawnSync(process.execPath, [BIN, 'github', input, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 1, `${args[0]} should be rejected`);
    assert.match(result.stderr, /not supported by the github command/);
  }
});

test('CLI github reports output write failures without a stack trace', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'report.cm');
  const blocked = join(dir, 'blocked');
  writeFileSync(input, '[!pass]\n');
  writeFileSync(blocked, 'not a directory');

  const result = spawnSync(
    process.execPath,
    [BIN, 'github', input, '-o', join(blocked, 'report.md')],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^error:/);
  assert.doesNotMatch(result.stderr, /\n {4}at /);
});

test('CLI render survives a live pipe from another Node process (no EAGAIN)', () => {
  const producer = "node -e \"setTimeout(()=>process.stdout.write('Build [!pass]\\n'),150)\"";
  const r = spawnSync(
    'bash',
    ['-c', `${producer} | node ${JSON.stringify(BIN)} render --color never`],
    { encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\[✓ PASS\]/);
});

test('CLI rejects an invalid --color value', () => {
  const err = process.stderr.write;
  process.stderr.write = () => true;
  try {
    assert.equal(run(['render', 'x.cm', '--color', 'rainbow']), 1);
  } finally {
    process.stderr.write = err;
  }
});

function runCapture(args, input) {
  try {
    const stdout = execFileSync(process.execPath, [BIN, ...args], { input, encoding: 'utf8' });
    return { code: 0, stdout };
  } catch (e) {
    return { code: e.status, stdout: (e.stdout || '').toString() };
  }
}

test('CLI lint reports problems and exits non-zero', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'bad.cm');
  writeFileSync(input, 'Build [!succes 3]\n');
  const { code, stdout } = runCapture(['lint', input]);
  assert.equal(code, 1);
  assert.match(stdout, /CM002/);
  assert.match(stdout, /bad\.cm:1:/);
});

test('CLI lint exits 0 for a clean file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'ok.cm');
  writeFileSync(input, '::: success\nAll good [!pass]\n:::\n');
  const { code } = runCapture(['lint', input]);
  assert.equal(code, 0);
});

test('CLI lint --disable suppresses a rule', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cm-cli-'));
  const input = join(dir, 'doc.cm');
  writeFileSync(input, 'Use `[!pass]` in docs.\n');
  assert.equal(runCapture(['lint', input]).code, 1);
  assert.equal(runCapture(['lint', input, '--disable', 'CM001']).code, 0);
});

test('CLI lint reads from stdin', () => {
  const { code, stdout } = runCapture(['lint'], '[!nope x]\n');
  assert.equal(code, 1);
  assert.match(stdout, /<stdin>:1:/);
  assert.match(stdout, /CM002/);
});
