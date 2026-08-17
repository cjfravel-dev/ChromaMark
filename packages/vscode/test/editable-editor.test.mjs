import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderEditable, blockRanges, replaceLines } from '../src/blocks.mjs';
import { blockToMarkdown, headingLevel } from '../src/inline-md.mjs';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
const { document } = dom.window;

/** Parses rendered HTML and returns the annotated top-level block elements. */
function blockElements(html) {
  const host = document.createElement('div');
  host.innerHTML = html;
  return [...host.querySelectorAll('[data-cm-block]')];
}

test('every top-level block carries its source line range', () => {
  const source = ['# Title', '', 'A paragraph.', '', '- one', '- two'].join('\n');
  const { html, blocks } = renderEditable(source);
  const elements = blockElements(html);

  assert.equal(elements.length, 3);
  assert.deepEqual(
    blocks.map((b) => [b.start, b.end]),
    [[0, 1], [2, 3], [4, 6]],
  );
  for (const element of elements) {
    const start = Number(element.getAttribute('data-cm-start'));
    const end = Number(element.getAttribute('data-cm-end'));
    assert.ok(end > start, 'a block must span at least one line');
  }
});

test('a ChromaMark container is one block spanning its whole source', () => {
  const source = ['::: success Deploy', '', 'Body text.', '', ':::'].join('\n');
  const { blocks } = renderEditable(source);

  assert.equal(blocks[0].start, 0);
  assert.equal(blocks[0].end, 5, 'the container owns the closing fence');
  assert.equal(blocks[0].mode, 'source');
});

test('editing a container rewrites its closing fence instead of orphaning it', () => {
  // token.map for a container stops *before* the closing ":::", so a naive
  // line-range replacement would leave a stray fence behind.
  const source = ['::: warning Old', 'body', ':::', '', 'After.'].join('\n');
  const { blocks } = renderEditable(source);
  const updated = replaceLines(source, blocks[0].start, blocks[0].end, '::: danger New\nbody\n:::');

  assert.equal(updated, ['::: danger New', 'body', ':::', '', 'After.'].join('\n'));
  assert.equal((updated.match(/^:::$/gm) || []).length, 1, 'no orphaned fence');
});

test('a nested container is still a single top-level block', () => {
  const source = [
    ':::: info Outer',
    '::: success Inner',
    'body',
    ':::',
    '::::',
    '',
    'After.',
  ].join('\n');
  const { blocks } = renderEditable(source);

  assert.equal(blocks.length, 2);
  assert.deepEqual([blocks[0].start, blocks[0].end], [0, 5], 'the outer fence pair is one block');
});

test('an unterminated container does not claim a line that is not there', () => {
  const { blocks } = renderEditable('::: info Open\nbody');
  assert.equal(blocks[0].end, 2);
});

test('plain paragraphs and headings are rich-editable', () => {
  const { blocks } = renderEditable('## Heading\n\nPlain **bold** and a [link](https://x.dev).');
  assert.deepEqual(blocks.map((b) => b.mode), ['rich', 'rich']);
});

test('a paragraph carrying ChromaMark inline syntax is source-edited, never rich', () => {
  for (const line of ['Status: [!ok healthy]', 'Coverage [=success 87%]', 'Rename {~~a~>b~~} here', 'A [.danger risk] word']) {
    const { blocks } = renderEditable(line);
    assert.equal(blocks[0].mode, 'source', `${line} must not be rich-editable`);
  }
});

test('tables, code fences and lists are source-edited', () => {
  const source = [
    '| a | b |',
    '| - | - |',
    '| 1 | 2 |',
    '',
    '```js',
    'const x = 1;',
    '```',
    '',
    '- item',
  ].join('\n');
  const { blocks } = renderEditable(source);
  assert.deepEqual(blocks.map((b) => b.mode), ['source', 'source', 'source']);
});

test('blockRanges skips closing tokens so blocks are not counted twice', () => {
  const { blocks } = renderEditable('::: info One\n:::\n\n::: info Two\n:::');
  assert.equal(blocks.length, 2);
});

test('replaceLines rewrites only the block that changed', () => {
  const source = ['# Title', '', 'Old text.', '', '::: warning Keep', 'me', ':::'].join('\n');
  const { blocks } = renderEditable(source);
  const paragraph = blocks[1];
  const updated = replaceLines(source, paragraph.start, paragraph.end, 'New **text**.');

  assert.match(updated, /^New \*\*text\*\*\.$/m);
  assert.match(updated, /^::: warning Keep$/m, 'untouched ChromaMark syntax survives byte for byte');
});

test('headingLevel reads the level off the rendered element', () => {
  const [h3] = blockElements(renderEditable('### Three').html);
  assert.equal(headingLevel(h3), 3);
  const [p] = blockElements(renderEditable('Text').html);
  assert.equal(headingLevel(p), 0);
});

test('an edited paragraph round-trips through the serializer', () => {
  const [element] = blockElements(renderEditable('Plain text.').html);
  element.innerHTML = 'Now <b>bold</b>, <i>italic</i>, <code>code</code> and <a href="https://x.dev">a link</a>.';

  assert.equal(
    blockToMarkdown(element),
    'Now **bold**, *italic*, `code` and [a link](https://x.dev).',
  );
});

test('an edited heading keeps its level', () => {
  const [element] = blockElements(renderEditable('## Old').html);
  element.textContent = 'New title';
  assert.equal(blockToMarkdown(element, { heading: 2 }), '## New title');
});

test('serializing refuses content it cannot write back as ChromaMark', () => {
  const [element] = blockElements(renderEditable('Text.').html);
  element.innerHTML = 'A pill <span class="cm-pill">PASS</span> here';
  assert.equal(blockToMarkdown(element), null, 'a lossy edit must be refused, not guessed at');
});

test('serializing refuses an image rather than dropping it', () => {
  const [element] = blockElements(renderEditable('Text.').html);
  element.innerHTML = 'Look <img src="x.png" alt="x">';
  assert.equal(blockToMarkdown(element), null);
});

test('markdown characters typed as text are escaped, not re-parsed', () => {
  const [element] = blockElements(renderEditable('Text.').html);
  element.textContent = 'Use *literal* stars and _underscores_';
  const markdown = blockToMarkdown(element);

  assert.equal(markdown, 'Use \\*literal\\* stars and \\_underscores\\_');
  const [again] = blockElements(renderEditable(markdown).html);
  assert.equal(again.textContent, 'Use *literal* stars and _underscores_', 'escaping round-trips');
});

test('a heading edited into multiple lines is refused', () => {
  const [element] = blockElements(renderEditable('## Old').html);
  element.innerHTML = 'One<br>Two';
  assert.equal(blockToMarkdown(element, { heading: 2 }), null);
});

test('an emptied block is refused rather than writing a blank line', () => {
  const [element] = blockElements(renderEditable('Text.').html);
  element.textContent = '   ';
  assert.equal(blockToMarkdown(element), null);
});

test('a full edit cycle leaves the rest of the document untouched', () => {
  const source = [
    '# Report',
    '',
    'Intro paragraph.',
    '',
    '::: success Deploy',
    'Replicas: 3/3 [!ok healthy]',
    ':::',
    '',
    'Closing [!warn note].',
  ].join('\n');

  const { html, blocks } = renderEditable(source);
  const elements = blockElements(html);
  const index = blocks.findIndex((b) => b.mode === 'rich' && b.start === 2);
  elements[index].innerHTML = 'Intro <b>paragraph</b>, edited.';

  const text = blockToMarkdown(elements[index], { heading: 0 });
  const updated = replaceLines(source, blocks[index].start, blocks[index].end, text);

  assert.equal(
    updated,
    source.replace('Intro paragraph.', 'Intro **paragraph**, edited.'),
    'only the edited block changes',
  );
  assert.deepEqual(blockRanges([]).length, 0);
});
