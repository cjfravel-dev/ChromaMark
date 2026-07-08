import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, render, theme } from '../src/index.js';
import { run } from '../src/cli.js';

const BIN = fileURLToPath(new URL('../bin/chromamark.js', import.meta.url));

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
