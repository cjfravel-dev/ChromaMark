import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { renderEditable, replaceLines } from '../src/blocks.mjs';

const bundlePath = fileURLToPath(new URL('../dist/editor.js', import.meta.url));

/**
 * Boots the bundled webview script against a rendered document, returning the
 * handles a test needs to drive it: the DOM, the messages it posts back to the
 * extension, and an `update` helper standing in for the extension host.
 */
function boot(source) {
  assert.ok(existsSync(bundlePath), 'dist/editor.js must be built before this test');
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="cm-doc"></div><div id="cm-status"></div></body></html>',
    { runScripts: 'outside-only', pretendToBeVisual: true },
  );
  const { window } = dom;
  const posted = [];

  window.acquireVsCodeApi = () => ({ postMessage: (m) => posted.push(m) });
  window.document.execCommand = () => true;
  window.scrollTo = () => {};

  window.eval(readFileSync(bundlePath, 'utf8'));

  let current = source;
  const update = (text = current) => {
    current = text;
    window.dispatchEvent(
      new window.MessageEvent('message', {
        data: { type: 'update', html: renderEditable(text).html, source: text },
      }),
    );
  };
  update(source);

  const fire = (node, type) =>
    node.dispatchEvent(new window.MouseEvent(type, { bubbles: true, cancelable: true }));
  const doubleClick = (node) => {
    fire(node, 'mousedown');
    fire(node, 'click');
    fire(node, 'dblclick');
  };

  return { dom, window, document: window.document, posted, update, doubleClick, source: () => current };
}

const blocks = (document) => [...document.querySelectorAll('[data-cm-block]')];

const DOC = [
  '# Report',
  '',
  'Intro paragraph.',
  '',
  '::: info Note',
  'callout body',
  ':::',
  '',
  '| a | b |',
  '| - | - |',
  '| 1 | 2 |',
].join('\n');

test('a single click does not start editing', () => {
  const { dom, document, window } = boot(DOC);
  try {
    const paragraph = blocks(document)[1];
    paragraph.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

    assert.equal(document.querySelector('.cm-source-editor'), null);
    assert.notEqual(paragraph.getAttribute('contenteditable'), 'true');
  } finally {
    dom.window.close();
  }
});

test('a double click opens a paragraph for rich editing', () => {
  const { dom, document, doubleClick } = boot(DOC);
  try {
    const paragraph = blocks(document)[1];
    doubleClick(paragraph);
    assert.equal(paragraph.getAttribute('contenteditable'), 'true');
  } finally {
    dom.window.close();
  }
});

test('a double click opens a table as source, same as every other block', () => {
  const { dom, document, doubleClick } = boot(DOC);
  try {
    const table = blocks(document).find((el) => el.tagName === 'TABLE');
    doubleClick(table);

    const area = document.querySelector('.cm-source-editor');
    assert.ok(area, 'the table opens in a source editor');
    assert.match(area.value, /^\| a \| b \|/);
  } finally {
    dom.window.close();
  }
});

test('a double click opens a callout as source', () => {
  const { dom, document, doubleClick } = boot(DOC);
  try {
    const callout = blocks(document).find((el) => el.className.includes('cm-block'));
    doubleClick(callout);

    const area = document.querySelector('.cm-source-editor');
    assert.ok(area);
    assert.match(area.value, /^::: info Note/);
    assert.match(area.value, /:::$/, 'the closing fence comes with it');
  } finally {
    dom.window.close();
  }
});

test('moving from one block to another commits the first and opens the second', () => {
  const { dom, document, posted, update, doubleClick } = boot(DOC);
  try {
    const table = blocks(document).find((el) => el.tagName === 'TABLE');
    doubleClick(table);
    const area = document.querySelector('.cm-source-editor');
    area.value = '| a | b |\n| - | - |\n| 9 | 9 |';

    // The reader goes straight for the callout without saving first.
    const callout = blocks(document).find((el) => el.className.includes('cm-block'));
    doubleClick(callout);

    const edit = posted.find((m) => m.type === 'edit');
    assert.ok(edit, 'the table edit is committed rather than dropped');
    assert.match(edit.text, /\| 9 \| 9 \|/);

    // The extension applies it and sends the document back.
    update(replaceLines(DOC, edit.start, edit.end, edit.text));

    const reopened = document.querySelector('.cm-source-editor');
    assert.ok(reopened, 'the callout opens once the edit has round-tripped');
    assert.match(reopened.value, /^::: info Note/, 'and it is the callout, not the table again');
  } finally {
    dom.window.close();
  }
});

test('a handoff lands on the right block even when the edit changed the line count', () => {
  const { dom, document, posted, update, doubleClick } = boot(DOC);
  try {
    // Grow the intro paragraph, which pushes every later block down.
    const paragraph = blocks(document)[1];
    doubleClick(paragraph);
    paragraph.textContent = 'Intro paragraph, now rather longer.';

    const table = blocks(document).find((el) => el.tagName === 'TABLE');
    doubleClick(table);

    const edit = posted.find((m) => m.type === 'edit');
    assert.ok(edit);
    update(replaceLines(DOC, edit.start, edit.end, 'Intro,\nnow spanning\nthree lines.'));

    const area = document.querySelector('.cm-source-editor');
    assert.ok(area, 'the table still opens after the document shifted');
    assert.match(area.value, /^\| a \| b \|/, 'and it is the table, not the block that took its place');
  } finally {
    dom.window.close();
  }
});

test('double-clicking inside the open editor selects a word instead of reopening', () => {
  const { dom, document, posted, doubleClick } = boot(DOC);
  try {
    const table = blocks(document).find((el) => el.tagName === 'TABLE');
    doubleClick(table);
    const area = document.querySelector('.cm-source-editor');

    doubleClick(area);

    assert.equal(document.querySelector('.cm-source-editor'), area, 'the editor stays open');
    assert.equal(posted.filter((m) => m.type === 'edit').length, 0, 'and nothing is committed');
  } finally {
    dom.window.close();
  }
});

test('Escape abandons an edit without writing anything back', () => {
  const { dom, window, document, posted, doubleClick } = boot(DOC);
  try {
    const table = blocks(document).find((el) => el.tagName === 'TABLE');
    doubleClick(table);
    document.querySelector('.cm-source-editor').value = 'destroyed';
    window.document.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );

    assert.equal(posted.filter((m) => m.type === 'edit').length, 0);
    assert.equal(document.querySelector('.cm-source-editor'), null, 'the rendered view comes back');
  } finally {
    dom.window.close();
  }
});

test('an unchanged block posts no edit', () => {
  const { dom, window, document, posted, doubleClick } = boot(DOC);
  try {
    const table = blocks(document).find((el) => el.tagName === 'TABLE');
    doubleClick(table);
    window.document.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true, cancelable: true }),
    );

    assert.equal(posted.filter((m) => m.type === 'edit').length, 0, 'saving an untouched block is a no-op');
  } finally {
    dom.window.close();
  }
});

test('a re-render while editing does not close the open editor', () => {
  const { dom, document, doubleClick, update } = boot(DOC);
  try {
    const table = blocks(document).find((el) => el.tagName === 'TABLE');
    doubleClick(table);
    const area = document.querySelector('.cm-source-editor');
    area.value = 'in progress';

    update(DOC);

    assert.equal(document.querySelector('.cm-source-editor'), area, 'the in-progress edit survives');
    assert.equal(area.value, 'in progress');
  } finally {
    dom.window.close();
  }
});
