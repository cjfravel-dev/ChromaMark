/**
 * Pure helpers for turning lcov coverage data into a ChromaMark report and
 * transpiling it to GitHub-native GFM.
 *
 * Coverage is produced per package in the lcov format: Node's built-in test
 * runner (`--test-reporter=lcov`) for the JavaScript packages and coverage.py
 * (`--cov-report=lcov`) for the Python package. Totals are derived from the
 * per-line detail records (DA / FNDA / BRDA) so the same parser works for both
 * producers regardless of which summary lines they emit.
 *
 * This module is side-effect free so it can be unit tested; the orchestration
 * that runs the tests and writes files lives in coverage.mjs.
 */

import { renderGitHub } from '@chromamark/renderer';

/** Marker embedded in the sticky PR comment so CI can find and update it. */
export const COMMENT_MARKER = '<!-- chromamark-coverage -->';

const emptyMetric = () => ({ found: 0, hit: 0 });

/**
 * Parse lcov text into one record per source file.
 * @param {string} text
 * @returns {Array<{file:string, lines:{found:number,hit:number}, branches:{found:number,hit:number}, functions:{found:number,hit:number}}>}
 */
export function parseLcov(text) {
    const records = [];
    let current = null;

    const start = () => ({
        file: '',
        lines: emptyMetric(),
        branches: emptyMetric(),
        functions: emptyMetric(),
    });

    for (const rawLine of String(text).split('\n')) {
        const line = rawLine.trim();
        if (line === '') continue;

        if (line.startsWith('SF:')) {
            current = start();
            current.file = line.slice(3);
            continue;
        }
        if (current === null) continue;

        if (line.startsWith('DA:')) {
            const count = Number(line.slice(3).split(',')[1]);
            current.lines.found += 1;
            if (count > 0) current.lines.hit += 1;
        } else if (line.startsWith('FNDA:')) {
            const count = Number(line.slice(5).split(',')[0]);
            current.functions.found += 1;
            if (count > 0) current.functions.hit += 1;
        } else if (line.startsWith('BRDA:')) {
            const taken = line.slice(5).split(',')[3];
            current.branches.found += 1;
            if (taken !== '-' && Number(taken) > 0) current.branches.hit += 1;
        } else if (line === 'end_of_record') {
            records.push(current);
            current = null;
        }
    }

    if (current !== null) records.push(current);
    return records;
}

/**
 * Sum line/branch/function metrics across the given records.
 */
export function aggregate(records) {
    const totals = {
        lines: emptyMetric(),
        branches: emptyMetric(),
        functions: emptyMetric(),
    };
    for (const record of records) {
        for (const key of ['lines', 'branches', 'functions']) {
            totals[key].found += record[key].found;
            totals[key].hit += record[key].hit;
        }
    }
    return totals;
}

/**
 * Coverage percentage for a metric, rounded to two decimals, or null when the
 * metric has nothing to measure (so callers can render "n/a").
 */
export function percent(metric) {
    if (!metric || metric.found === 0) return null;
    return Math.round((metric.hit / metric.found) * 10000) / 100;
}

/**
 * Build a package report from raw lcov text: keep only files that belong to the
 * package (dropping anything pulled in from a sibling via `../` or an absolute
 * path), prefix each file with the package directory, and compute totals.
 */
export function buildReport({ name, dir, lcovText }) {
    const own = parseLcov(lcovText).filter(
        (r) => !r.file.startsWith('..') && !r.file.startsWith('/'),
    );
    const files = own.map((r) => ({
        ...r,
        file: dir ? `${dir}/${r.file}` : r.file,
    }));
    return { name, dir, files, totals: aggregate(files) };
}

function cell(metric) {
    const p = percent(metric);
    if (p === null) return 'n/a';
    return `${p.toFixed(2)}% (${metric.hit}/${metric.found})`;
}

function row(label, totals) {
    return `| ${label} | ${cell(totals.lines)} | ${cell(totals.branches)} | ${cell(totals.functions)} |`;
}

function code(text) {
    const longest = Math.max(0, ...Array.from(String(text).matchAll(/`+/g), (match) => match[0].length));
    const fence = '`'.repeat(Math.max(1, longest + 1));
    return `${fence}${text}${fence}`;
}

/**
 * Author a ChromaMark coverage report with a per-package table, a bold total
 * row, a status pill, and a collapsed per-file breakdown.
 *
 * @param {Array<{name:string, dir?:string, files:Array, totals:object}>} reports
 */
export function formatChromaMark(reports) {
    const lines = [];

    const combined = aggregate(reports.flatMap((r) => r.files));
    const total = percent(combined.lines);
    const status = total === null ? '[!muted n/a]' : `[!success ${total.toFixed(2)}%]`;
    lines.push(`## 🎨 Coverage ${status}`, '');
    lines.push('| Package | Lines | Branches | Functions |');
    lines.push('| --- | --- | --- | --- |');

    for (const report of reports) {
        lines.push(row(report.name, report.totals));
    }
    lines.push(row('**Total**', combined));

    const files = reports.flatMap((r) => r.files);
    if (files.length > 0) {
        lines.push('', '::: details Per-file coverage');
        lines.push('| File | Lines | Branches | Functions |');
        lines.push('| --- | --- | --- | --- |');
        for (const f of files) {
            lines.push(row(code(f.file), f));
        }
        lines.push(':::');
    }

    lines.push('');
    return lines.join('\n');
}

/**
 * Transpile the authored ChromaMark report to GitHub-native GFM.
 *
 * @param {Array<{name:string, dir?:string, files:Array, totals:object}>} reports
 * @param {{marker?:boolean}} [opts] when marker is set, prepend COMMENT_MARKER.
 */
export function formatSummary(reports, opts = {}) {
    const summary = renderGitHub(formatChromaMark(reports));
    return opts.marker ? `${COMMENT_MARKER}\n\n${summary}` : summary;
}
