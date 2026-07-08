import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const TOC_SRC = readFileSync(fileURLToPath(new URL('../media/toc.js', import.meta.url)), 'utf8');

const headingsHtml = (n) =>
  Array.from({ length: n }, (_, i) => `<h2>Section ${i + 1}</h2><p>body ${i + 1}</p>`).join('');

/** Load toc.js into a fresh jsdom document and return handles + a scrollIntoView spy. */
function load(bodyHtml) {
  const dom = new JSDOM(`<!doctype html><html><body>${bodyHtml}</body></html>`, {
    runScripts: 'outside-only',
  });
  const { window } = dom;
  const scrolled = [];
  window.Element.prototype.scrollIntoView = function scrollIntoView() {
    scrolled.push(this);
  };
  window.eval(TOC_SRC);
  if (!window.document.getElementById('cm-toc')) {
    window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  }
  return { dom, window, document: window.document, scrolled };
}

test('TOC links point at real heading anchors, not bare "#"', () => {
  const { dom, document } = load(headingsHtml(4));
  try {
    const links = [...document.querySelectorAll('#cm-toc .cm-toc-link')];
    assert.equal(links.length, 4);
    for (const a of links) {
      const href = a.getAttribute('href');
      assert.match(href, /^#.+/, `expected a real fragment href, got ${JSON.stringify(href)}`);
    }
  } finally {
    dom.window.close();
  }
});

test('headings receive ids and links resolve to them', () => {
  const { dom, document } = load(headingsHtml(4));
  try {
    const hs = [...document.querySelectorAll('h2')];
    for (const h of hs) assert.ok(h.id, 'each heading should have an id');
    const ids = hs.map((h) => '#' + h.id);
    const hrefs = [...document.querySelectorAll('#cm-toc .cm-toc-link')].map((a) => a.getAttribute('href'));
    assert.deepEqual(hrefs, ids);
  } finally {
    dom.window.close();
  }
});

test('clicking scrolls the CURRENT heading after the body is re-rendered (stale-ref safe)', () => {
  const { dom, window, document, scrolled } = load(headingsHtml(4));
  try {
    // Simulate VS Code replacing the rendered content with fresh nodes (new
    // heading elements), as it does on every preview update.
    [...document.querySelectorAll('h2, p')].forEach((n) => n.remove());
    document.body.insertAdjacentHTML('afterbegin', headingsHtml(4));
    const freshHeadings = [...document.querySelectorAll('h2')];

    // Click the 3rd outline link synchronously, before the observer rebuild.
    const link = document.querySelectorAll('#cm-toc .cm-toc-link')[2];
    link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

    assert.equal(
      scrolled.at(-1),
      freshHeadings[2],
      'should scroll the current 3rd heading, not a stale/detached node',
    );
  } finally {
    dom.window.close();
  }
});
