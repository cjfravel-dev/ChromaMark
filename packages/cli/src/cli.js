/**
 * ChromaMark CLI argument handling: build single files, directories, stdin,
 * with optional watch mode.
 */

import {
  readFileSync, writeFileSync, statSync, readdirSync, mkdirSync, watch,
} from 'node:fs';
import { join, basename, extname, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from './index.js';

const HELP = `chromamark — compile ChromaMark (.cm) to self-contained HTML

Usage:
  chromamark [build] <input.cm> [-o <output.html>]   compile one file
  chromamark [build] <dir> -o <outdir>               compile every .cm in a tree
  chromamark <input.cm> --stdout                     write HTML to stdout
  cat file.cm | chromamark -                          read from stdin

Options:
  -o, --output <path>   output file or directory
  --stdout              write HTML to stdout instead of a file
  --title <text>        page title (default: derived from the file name)
  --watch               rebuild when inputs change
  -h, --help            show this help
  -v, --version         print the version
`;

function version() {
  const url = new URL('../package.json', import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(url), 'utf8')).version;
}

function parseArgs(argv) {
  const opts = { input: null, output: null, stdout: false, title: null, watch: false };
  const rest = argv[0] === 'build' ? argv.slice(1) : argv.slice(0);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '-v' || a === '--version') opts.version = true;
    else if (a === '--stdout') opts.stdout = true;
    else if (a === '--watch') opts.watch = true;
    else if (a === '-o' || a === '--output') opts.output = rest[++i];
    else if (a === '--title') opts.title = rest[++i];
    else if (a === '-') opts.input = '-';
    else if (a.startsWith('-')) throw new Error(`unknown option: ${a}`);
    else if (opts.input == null) opts.input = a;
  }
  return opts;
}

function titleFor(file) {
  return basename(file, extname(file));
}

function listCmFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listCmFiles(full));
    else if (entry.isFile() && extname(entry.name) === '.cm') out.push(full);
  }
  return out;
}

function buildFile(input, output, opts, log) {
  const html = compile(readFileSync(input, 'utf8'), { title: opts.title || titleFor(input) });
  if (opts.stdout) {
    process.stdout.write(html);
    return;
  }
  const target = output || input.replace(/\.cm$/, '') + '.html';
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html);
  if (log) process.stderr.write(`built ${target}\n`);
}

function buildDir(input, outdir) {
  if (!outdir) throw new Error('building a directory requires -o <outdir>');
  const files = listCmFiles(input);
  for (const file of files) {
    const rel = relative(input, file).replace(/\.cm$/, '') + '.html';
    const target = join(outdir, rel);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, compile(readFileSync(file, 'utf8'), { title: titleFor(file) }));
  }
  process.stderr.write(`built ${files.length} file(s) into ${outdir}\n`);
  return files;
}

export function run(argv = process.argv.slice(2)) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    process.stderr.write(`${err.message}\n\n${HELP}`);
    return 1;
  }

  if (opts.help) { process.stdout.write(HELP); return 0; }
  if (opts.version) { process.stdout.write(`${version()}\n`); return 0; }

  if (opts.input === '-' || (opts.input == null && !process.stdin.isTTY)) {
    process.stdout.write(compile(readFileSync(0, 'utf8'), { title: opts.title || 'ChromaMark' }));
    return 0;
  }
  if (opts.input == null) { process.stderr.write(HELP); return 1; }

  let info;
  const rebuild = () => {
    if (info.isDirectory()) buildDir(opts.input, opts.output);
    else buildFile(opts.input, opts.output, opts, true);
  };

  try {
    info = statSync(opts.input);
    rebuild();
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n`);
    return 1;
  }

  if (opts.watch && !opts.stdout) {
    process.stderr.write('watching for changes… (Ctrl+C to stop)\n');
    const onChange = () => {
      try { rebuild(); } catch (err) { process.stderr.write(`error: ${err.message}\n`); }
    };
    try {
      watch(opts.input, { recursive: info.isDirectory() }, onChange);
    } catch {
      watch(opts.input, onChange); // non-recursive fallback (older Node / platforms)
    }
    return 0;
  }
  return 0;
}
