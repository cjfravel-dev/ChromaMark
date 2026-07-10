import { test } from 'node:test';
import assert from 'node:assert/strict';
import mdChromamark, { render, createRenderer } from '../src/index.js';
import MarkdownIt from 'markdown-it';

test('default export is a markdown-it plugin function', () => {
  assert.equal(typeof mdChromamark, 'function');
  const md = new MarkdownIt().use(mdChromamark);
  assert.match(md.render('[!pass]'), /cm-pill/);
});

test('createRenderer returns a configured markdown-it instance', () => {
  const md = createRenderer();
  assert.equal(typeof md.render, 'function');
  assert.match(md.render('[!pass]'), /cm-pill/);
});

test('render is a convenience wrapper returning HTML', () => {
  assert.equal(typeof render('x'), 'string');
});

test('GFM tables still render', () => {
  const html = render('| a | b |\n| - | - |\n| 1 | 2 |');
  assert.match(html, /<table>/);
  assert.match(html, /<td>1<\/td>/);
});

test('GFM strikethrough still renders', () => {
  assert.match(render('~~gone~~'), /<s>gone<\/s>/);
});

test('plain CommonMark is unchanged', () => {
  assert.match(render('# Title\n\nA **bold** word.'), /<h1>Title<\/h1>/);
  assert.match(render('# Title\n\nA **bold** word.'), /<strong>bold<\/strong>/);
});

test('features can be toggled off via options', () => {
  const md = createRenderer({ pill: false });
  assert.match(md.render('[!pass]'), /\[!pass\]/);
  assert.doesNotMatch(md.render('[!pass]'), /cm-pill/);
});

test('a caller-supplied highlight hook renders fenced code without bundling a highlighter', () => {
  const calls = [];
  const html = render('```js extra\nconst x = 1;\n```', {
    highlight(code, language, attrs) {
      calls.push({ code, language, attrs });
      return '<span class="keyword">const</span> x = 1;';
    },
  });
  assert.deepEqual(calls, [{ code: 'const x = 1;\n', language: 'js', attrs: 'extra' }]);
  assert.match(html, /<span class="keyword">const<\/span> x = 1;/);
});
