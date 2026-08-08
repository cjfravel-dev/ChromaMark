import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { render } from '../src/index.js';
import { enhanceRowGroups } from '../src/rowgroups-dom.js';

const SOURCE = [
  '| Task | Owner |',
  '| --- | --- |',
  '| Setup | ops |',
  '| ↳ Network | ops |',
  '| ↳↳ DNS | ops |',
  '| Teardown | ops |',
].join('\n');

function mount(source = SOURCE) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${render(source)}</body></html>`);
  global.window = dom.window;
  global.document = dom.window.document;
  const table = dom.window.document.querySelector('table');
  return { dom, table };
}

const labels = (table) =>
  Array.from(table.querySelectorAll('tr.cm-row'))
    .filter((row) => !row.hidden)
    .map((row) => row.querySelector('td').textContent.trim());

const toggleFor = (table, label) =>
  Array.from(table.querySelectorAll('tr.cm-row')).find((row) =>
    row.querySelector('td').textContent.includes(label),
  ).querySelector('.cm-row-toggle');

test('row groups start expanded so the enhancer never hides content on load', () => {
  const { table } = mount();
  assert.equal(enhanceRowGroups(document), 1);
  assert.deepEqual(labels(table), ['Setup', 'Network', 'DNS', 'Teardown']);
  for (const toggle of table.querySelectorAll('.cm-row-toggle')) {
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  }
});

test('the emitted toggle already advertises the expanded state before any script runs', () => {
  const html = render(SOURCE);
  assert.match(html, /<button class="cm-row-toggle" type="button" aria-expanded="true"/);
  assert.doesNotMatch(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /\shidden(\s|>)/);
});

test('collapsing a parent hides its whole subtree', () => {
  const { table } = mount();
  enhanceRowGroups(document);
  toggleFor(table, 'Setup').click();
  assert.deepEqual(labels(table), ['Setup', 'Teardown']);
  assert.equal(toggleFor(table, 'Setup').getAttribute('aria-expanded'), 'false');
});

test('a nested group the reader collapsed stays collapsed when its parent reopens', () => {
  const { table } = mount();
  enhanceRowGroups(document);
  toggleFor(table, 'Network').click();
  assert.deepEqual(labels(table), ['Setup', 'Network', 'Teardown']);
  toggleFor(table, 'Setup').click();
  assert.deepEqual(labels(table), ['Setup', 'Teardown']);
  toggleFor(table, 'Setup').click();
  assert.deepEqual(labels(table), ['Setup', 'Network', 'Teardown']);
});

test('tables without row markers are left alone', () => {
  const { table } = mount('| A | B |\n| --- | --- |\n| 1 | 2 |');
  assert.equal(enhanceRowGroups(document), 0);
  assert.equal(table.getAttribute('data-cm-rowgroups'), null);
});

test('enhancing twice does not double-bind the toggle', () => {
  const { table } = mount();
  enhanceRowGroups(document);
  enhanceRowGroups(document);
  toggleFor(table, 'Setup').click();
  assert.deepEqual(labels(table), ['Setup', 'Teardown']);
});
