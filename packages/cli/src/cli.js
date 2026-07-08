/**
 * ChromaMark CLI argument handling: build single files, directories, stdin,
 * with optional watch mode.
 */

import {
  readFileSync, writeFileSync, statSync, readdirSync, mkdirSync, watch,
} from 'node:fs';
import { join, basename, extname, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, renderAnsi, lint } from './index.js';

const HELP = `chromamark — compile ChromaMark (.cm) to HTML, render it, or lint it

Usage:
  chromamark [build] <input.cm> [-o <output.html>]   compile one file to HTML
  chromamark [build] <dir> -o <outdir>               compile every .cm in a tree
  chromamark render <input.cm>                       render to ANSI on stdout
  chromamark lint <input.cm>                         check for common mistakes
  cat file.cm | chromamark render                    render stdin to ANSI
  chromamark <input.cm> --stdout                     write HTML to stdout
  cat file.cm | chromamark -                          read HTML from stdin

Options:
  -o, --output <path>   output file or directory (build)
  --stdout              write HTML to stdout instead of a file
  --title <text>        page title (default: derived from the file name)
  --color <when>        colorize render output: auto (default), always, never
  --no-color            disable color (same as --color never)
  --disable <rules>     lint: comma-separated rule ids to suppress (e.g. CM001)
  --watch               rebuild when inputs change
  -h, --help            show this help
  -v, --version         print the version
`;

const COMMANDS = new Set(['build', 'render', 'lint']);

function version() {
  const url = new URL('../package.json', import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(url), 'utf8')).version;
}

function parseArgs(argv) {
  const opts = {
    command: 'build', input: null, output: null, stdout: false, title: null, watch: false, color: 'auto', disable: [],
  };
  let rest = argv;
  if (argv.length && COMMANDS.has(argv[0])) {
    opts.command = argv[0];
    rest = argv.slice(1);
  }
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    const takeValue = (flag) => {
      const next = rest[i + 1];
      if (next === undefined || next.startsWith('-')) {
        throw new Error(`option ${flag} requires a value`);
      }
      i += 1;
      return next;
    };
    if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '-v' || a === '--version') opts.version = true;
    else if (a === '--stdout') opts.stdout = true;
    else if (a === '--watch') opts.watch = true;
    else if (a === '--no-color') opts.color = 'never';
    else if (a === '--color') {
      const v = takeValue(a);
      if (!['auto', 'always', 'never'].includes(v)) throw new Error('--color must be auto, always, or never');
      opts.color = v;
    } else if (a === '--disable') {
      opts.disable = opts.disable.concat(takeValue(a).split(',').map((s) => s.trim()).filter(Boolean));
    } else if (a === '-o' || a === '--output') opts.output = takeValue(a);
    else if (a === '--title') opts.title = takeValue(a);
    else if (a === '-') opts.input = '-';
    else if (a.startsWith('-')) throw new Error(`unknown option: ${a}`);
    else if (opts.input == null) opts.input = a;
  }
  return opts;
}

function titleFor(file) {
  return basename(file, extname(file));
}

/** Read source from a file, `-`, or piped stdin. Returns { src, path } or an
 *  error shape ({ error } / { empty }) the command can turn into an exit code. */
function readInput(opts) {
  if (opts.input === '-' || (opts.input == null && !process.stdin.isTTY)) {
    const src = readFileSync(0, 'utf8');
    if (opts.input !== '-' && !src.trim()) return { empty: true };
    return { src, path: '<stdin>' };
  }
  if (opts.input == null) return null;
  return { src: readFileSync(opts.input, 'utf8'), path: opts.input };
}

/** Render ChromaMark to ANSI on stdout, from a file, `-`, or piped stdin. */
function runRender(opts) {
  let input;
  try {
    input = readInput(opts);
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n`);
    return 1;
  }
  if (!input || input.empty) {
    process.stderr.write(`error: render needs an input file or piped stdin\n\n${HELP}`);
    return 1;
  }
  process.stdout.write(renderAnsi(input.src, { color: opts.color }));
  return 0;
}

/** Lint ChromaMark and print diagnostics; exit non-zero when any are found. */
function runLint(opts) {
  let input;
  try {
    input = readInput(opts);
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n`);
    return 1;
  }
  if (!input || input.empty) {
    process.stderr.write(`error: lint needs an input file or piped stdin\n\n${HELP}`);
    return 1;
  }
  const diags = lint(input.src, { disable: opts.disable });
  for (const d of diags) {
    process.stdout.write(`${input.path}:${d.line}:${d.column}  ${d.severity}  ${d.rule}  ${d.message}\n`);
  }
  if (diags.length) {
    process.stderr.write(`✗ ${diags.length} problem${diags.length === 1 ? '' : 's'}\n`);
    return 1;
  }
  process.stderr.write(`✓ ${input.path}: no problems\n`);
  return 0;
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

  if (opts.command === 'render') {
    return runRender(opts);
  }
  if (opts.command === 'lint') {
    return runLint(opts);
  }

  if (opts.input === '-' || (opts.input == null && !process.stdin.isTTY)) {
    const src = readFileSync(0, 'utf8');
    if (opts.input !== '-' && !src.trim()) {
      process.stderr.write(`error: no input file given and stdin was empty\n\n${HELP}`);
      return 1;
    }
    process.stdout.write(compile(src, { title: opts.title || 'ChromaMark' }));
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
