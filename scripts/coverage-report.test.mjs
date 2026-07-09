import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLcov,
  aggregate,
  percent,
  buildReport,
  formatSummary,
  COMMENT_MARKER,
} from './coverage-report.mjs';

const NODE_RECORD = `TN:
SF:src/foo.js
FN:1,alpha
FN:5,beta
FNDA:3,alpha
FNDA:0,beta
FNF:2
FNH:1
DA:1,3
DA:2,3
DA:3,0
LF:3
LH:2
BRDA:2,0,0,3
BRDA:2,0,1,-
BRF:2
BRH:1
end_of_record
`;

// A cli-style report that transitively pulls in a sibling package via ../ .
const CLI_LCOV = `SF:src/cli.js
DA:1,1
DA:2,0
FNDA:1,run
BRDA:1,0,0,1
BRDA:1,0,1,-
end_of_record
SF:../renderer/src/ansi.js
DA:1,1
FNDA:1,paint
end_of_record
`;

test('parseLcov derives line/branch/function totals from detail lines', () => {
  const records = parseLcov(NODE_RECORD);
  assert.equal(records.length, 1);
  const r = records[0];
  assert.equal(r.file, 'src/foo.js');
  assert.deepEqual(r.lines, { found: 3, hit: 2 });
  assert.deepEqual(r.functions, { found: 2, hit: 1 });
  assert.deepEqual(r.branches, { found: 2, hit: 1 });
});

test('parseLcov treats a branch taken count of 0 or "-" as not hit', () => {
  const [r] = parseLcov(NODE_RECORD);
  // BRDA taken values are 3 and "-": exactly one covered.
  assert.equal(r.branches.hit, 1);
});

test('aggregate sums metrics across records', () => {
  const totals = aggregate(parseLcov(CLI_LCOV));
  assert.deepEqual(totals.lines, { found: 3, hit: 2 });
  assert.deepEqual(totals.functions, { found: 2, hit: 2 });
  assert.deepEqual(totals.branches, { found: 2, hit: 1 });
});

test('percent returns a rounded ratio, or null when nothing was found', () => {
  assert.equal(percent({ found: 4, hit: 1 }), 25);
  assert.equal(percent({ found: 0, hit: 0 }), null);
  assert.equal(Math.round(percent({ found: 3, hit: 2 }) * 100) / 100, 66.67);
});

test('buildReport keeps only files inside the package and prefixes them with dir', () => {
  const report = buildReport({ name: 'cli', dir: 'packages/cli', lcovText: CLI_LCOV });
  assert.equal(report.name, 'cli');
  assert.deepEqual(
    report.files.map((f) => f.file),
    ['packages/cli/src/cli.js'],
  );
  // The ../renderer file is excluded from this package's own totals.
  assert.deepEqual(report.totals.lines, { found: 2, hit: 1 });
  assert.deepEqual(report.totals.functions, { found: 1, hit: 1 });
});

test('formatSummary renders a GFM table with a bold total row and the sticky marker', () => {
  const reports = [
    buildReport({ name: 'renderer', dir: 'packages/renderer', lcovText: NODE_RECORD }),
    buildReport({ name: 'cli', dir: 'packages/cli', lcovText: CLI_LCOV }),
  ];
  const md = formatSummary(reports);
  assert.match(md, /## .*Coverage/);
  assert.match(md, /\| *Package *\|/);
  assert.match(md, /renderer/);
  assert.match(md, /\*\*Total\*\*/);
  // Percent cells are formatted with two decimals and hit/found detail.
  assert.match(md, /66\.67% \(2\/3\)/);
  // Per-file breakdown is available but collapsed.
  assert.match(md, /<details>/);
  assert.match(md, /packages\/cli\/src\/cli\.js/);
});

test('formatSummary embeds the marker when asked, for sticky PR comments', () => {
  const md = formatSummary([], { marker: true });
  assert.ok(md.startsWith(COMMENT_MARKER));
});

test('COMMENT_MARKER is a stable html comment used to find the sticky comment', () => {
  assert.equal(COMMENT_MARKER, '<!-- chromamark-coverage -->');
});
