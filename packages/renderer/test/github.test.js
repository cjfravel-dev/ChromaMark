import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderGitHub } from '../src/index.js';

test('callouts become GitHub Alerts with titles and tone-aware kbd pills', () => {
  const source = [
    '::: success Deploy',
    'All good [!ok PASS]',
    ':::',
  ].join('\n');

  assert.equal(
    renderGitHub(source),
    [
      '> [!TIP]',
      '> **Deploy**',
      '>',
      '> All good ✅ <kbd>PASS</kbd>',
      '',
    ].join('\n'),
  );
});

test('all semantic tones map deterministically to GitHub Alert types', () => {
  const expected = new Map([
    ['success', 'TIP'],
    ['tip', 'TIP'],
    ['info', 'NOTE'],
    ['muted', 'NOTE'],
    ['warning', 'WARNING'],
    ['danger', 'CAUTION'],
  ]);

  for (const [tone, alert] of expected) {
    assert.match(renderGitHub(`::: ${tone}\nbody\n:::`), new RegExp(`^> \\[!${alert}\\]`, 'm'));
  }
});

test('details become native GitHub details with a tone icon and open state', () => {
  assert.equal(
    renderGitHub('::: details open warning Logs\n**failure** details\n:::'),
    [
      '<details open>',
      '<summary>⚠️ Logs</summary>',
      '',
      '**failure** details',
      '',
      '</details>',
      '',
    ].join('\n'),
  );
});

test('details summaries preserve inline formatting with GitHub-safe HTML', () => {
  const output = renderGitHub(
    '::: details Logs **failed** `test_x` [docs](https://example.com) [!warn P1]\nbody\n:::',
  );
  assert.match(
    output,
    /<summary>Logs <strong>failed<\/strong> <code>test_x<\/code> <a href="https:\/\/example\.com">docs<\/a> ⚠️ <kbd>P1<\/kbd><\/summary>/,
  );
});

test('fields become a native GFM table and escape cell delimiters', () => {
  assert.equal(
    renderGitHub('::: fields\nRegion: eastus\nFilter: a | b\nStatus: [!ok healthy]\n:::'),
    [
      '| Field | Value |',
      '| --- | --- |',
      '| Region | eastus |',
      '| Filter | a \\| b |',
      '| Status | ✅ <kbd>healthy</kbd> |',
      '',
    ].join('\n'),
  );
});

test('meters, colored text, and CriticMarkup degrade to portable GFM', () => {
  const source = [
    '[.danger critical] [=success 80%]',
    '{++added++} {--removed--} {~~old~>new~~} {==marked==} {>>note<<}',
  ].join('\n');

  assert.equal(
    renderGitHub(source),
    [
      'critical ████████░░ 80%',
      '<ins>added</ins> ~~removed~~ ~~old~~<ins>new</ins> **marked** _(note)_',
      '',
    ].join('\n'),
  );
});

test('ordinary GFM structure remains native and links stay intact', () => {
  const source = [
    '# Report',
    '',
    '- **build** [docs](https://example.com)',
    '- `lint`',
    '',
    '| Stage | Result |',
    '| --- | --- |',
    '| unit | pass |',
  ].join('\n');
  const output = renderGitHub(source);

  assert.match(output, /^# Report$/m);
  assert.match(output, /^- \*\*build\*\* \[docs\]\(https:\/\/example\.com\)$/m);
  assert.match(output, /^- `lint`$/m);
  assert.match(output, /\| Stage \| Result \|/);
  assert.match(output, /\| unit \| pass \|/);
});

test('link and image titles escape backslashes before GFM serialization', () => {
  assert.equal(
    renderGitHub('[docs](https://example.com "C:\\\\temp")'),
    '[docs](https://example.com "C:\\\\temp")\n',
  );
  assert.equal(
    renderGitHub('![plot](plot.png "C:\\\\plots")'),
    '![plot](plot.png "C:\\\\plots")\n',
  );
});

test('escaped leading block markers remain literal after GitHub reparsing', () => {
  assert.equal(
    renderGitHub('\\# not a heading\n\n\\- not a list\n\n1\\. not a list\n\n\\---\n\ntext\n\\==='),
    '\\# not a heading\n\n\\- not a list\n\n1\\. not a list\n\n\\---\n\ntext\n\\===\n',
  );
});

test('loose lists do not emit whitespace-only separator lines', () => {
  const output = renderGitHub('- first paragraph\n\n  second paragraph\n\n- next item');
  assert.doesNotMatch(output, /^[ \t]+$/m);
  assert.match(output, /- first paragraph\n\n {2}second paragraph/);
});

test('GFM table alignment is preserved', () => {
  const output = renderGitHub([
    '| Left | Center | Right |',
    '| :--- | :---: | ---: |',
    '| a | b | c |',
  ].join('\n'));
  assert.match(output, /\| :--- \| :---: \| ---: \|/);
});

test('raw HTML is escaped by default and preserved only when explicitly trusted', () => {
  const source = '<p align="center"><img src="logo.png"></p>';
  assert.equal(
    renderGitHub(source),
    '&lt;p align=&quot;center&quot;&gt;&lt;img src=&quot;logo.png&quot;&gt;&lt;/p&gt;\n',
  );
  assert.equal(renderGitHub(source, { allowHtml: true }), `${source}\n`);
});
