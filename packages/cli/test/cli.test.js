import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, render, theme } from '../src/index.js';
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
  const child = spawn(process.execPath, [BIN, input, '--watch', '-o', output], { stdio: 'ignore' });
  try {
    const built = await waitFor(() => existsSync(output) && readFileSync(output, 'utf8').includes('first version'), 4000);
    assert.ok(built, 'initial build did not happen');
    writeFileSync(input, '::: success\nsecond version\n:::\n');
    const rebuilt = await waitFor(() => readFileSync(output, 'utf8').includes('second version'), 4000);
    assert.ok(rebuilt, 'watch did not rebuild on change');
  } finally {
    child.kill();
  }
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

test('CLI errors (exit 1) on empty stdin with no input arg and no explicit -', () => {
  assert.throws(() => execFileSync(BIN, [], { input: '' }));
});

test('CLI still reads explicit - from stdin', () => {
  const out = execFileSync(BIN, ['-'], { input: '::: success\nhi\n:::\n', encoding: 'utf8' });
  assert.match(out, /<div class="cm-block" data-tone="success">/);
});
