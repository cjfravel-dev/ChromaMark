/**
 * Runs the test suites with coverage across the ChromaMark packages, then
 * writes a combined Markdown summary.
 *
 *   - JavaScript packages use Node's built-in runner with the lcov reporter.
 *   - The Python package uses coverage.py via pytest-cov.
 *
 * Outputs (all under coverage/ at the repo root, which is git-ignored):
 *   - coverage/summary.md   human-readable summary
 *   - coverage/comment.md   same summary with the sticky-comment marker
 * When run in GitHub Actions it also appends the summary to the job summary.
 *
 * Runnable locally:  npm run coverage
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildReport, formatSummary } from './coverage-report.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const NODE_REPORTERS = [
    '--test-reporter=spec',
    '--test-reporter-destination=stdout',
    '--test-reporter=lcov',
    '--test-reporter-destination=coverage/lcov.info',
];

// Performance tests assert wall-clock budgets that coverage instrumentation
// inflates, so they are skipped here (matched by name); they still run
// un-instrumented in the dedicated Renderer/Python CI jobs. Correctness tests
// living in the same files continue to run and count toward coverage.
const NODE_SKIP_PERF = '--test-skip-pattern=linear time';
const PYTEST_SKIP_PERF = ['-k', 'not linear'];

/** Package definitions in the order they appear in the report. */
const packages = [
    {
        name: 'renderer',
        dir: 'packages/renderer',
        command: process.execPath,
        args: ['--test', '--experimental-test-coverage', NODE_SKIP_PERF, ...NODE_REPORTERS],
    },
    {
        name: 'cli',
        dir: 'packages/cli',
        command: process.execPath,
        args: ['--test', '--experimental-test-coverage', NODE_SKIP_PERF, ...NODE_REPORTERS],
    },
    {
        name: 'python',
        dir: 'packages/python',
        command: pythonBin('packages/python'),
        args: [
            '-m',
            'pytest',
            '-q',
            ...PYTEST_SKIP_PERF,
            '--cov=chromamark',
            '--cov-branch',
            '--cov-report=lcov:coverage/lcov.info',
            '--cov-report=term-missing',
        ],
    },
];

function pythonBin(pkgDir) {
    const venv = join(root, pkgDir, '.venv', 'bin', 'python');
    if (existsSync(venv)) return venv;
    return process.env.PYTHON || 'python3';
}

let failed = false;
const reports = [];

for (const pkg of packages) {
    const cwd = join(root, pkg.dir);
    mkdirSync(join(cwd, 'coverage'), { recursive: true });

    console.log(`\n=== coverage: ${pkg.name} ===`);
    const result = spawnSync(pkg.command, pkg.args, { cwd, stdio: 'inherit' });
    if (result.status !== 0) {
        failed = true;
        console.error(`✖ ${pkg.name} tests failed (exit ${result.status})`);
    }

    const lcovPath = join(cwd, 'coverage', 'lcov.info');
    if (!existsSync(lcovPath)) {
        console.error(`✖ ${pkg.name}: no lcov produced at ${lcovPath}`);
        continue;
    }
    reports.push(buildReport({ name: pkg.name, dir: pkg.dir, lcovText: readFileSync(lcovPath, 'utf8') }));
}

const outDir = join(root, 'coverage');
mkdirSync(outDir, { recursive: true });

const summary = formatSummary(reports);
writeFileSync(join(outDir, 'summary.md'), summary);
writeFileSync(join(outDir, 'comment.md'), formatSummary(reports, { marker: true }));

console.log(`\n${summary}`);

if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

if (failed) {
    console.error('\n✖ One or more test suites failed.');
    process.exit(1);
}
