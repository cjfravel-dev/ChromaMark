import { test } from 'node:test';
import assert from 'node:assert/strict';
import MarkdownIt from 'markdown-it';
import chromamark from '../src/index.js';

// Defense-in-depth: the fields renderer uses md.renderInline for values, so it
// must neutralize raw HTML regardless of the host markdown-it's `html` option.

test('fields values are HTML-escaped even on an html:true markdown-it instance', () => {
  const md = new MarkdownIt({ html: true }).use(chromamark);
  const out = md.render('::: fields\nStatus: <img src=x onerror=alert(1)>\n:::');
  assert.doesNotMatch(out, /<img/, 'raw <img> must not survive');
  assert.match(out, /&lt;img/);
});

test('fields values still render inline ChromaMark and markdown', () => {
  const md = new MarkdownIt({ html: true }).use(chromamark);
  const out = md.render('::: fields\nStatus: [!ok healthy] `code`\n:::');
  assert.match(out, /<span class="cm-pill" data-tone="success">healthy<\/span>/);
  assert.match(out, /<code>code<\/code>/);
});

test('the host markdown-it html option is left unchanged after rendering fields', () => {
  const md = new MarkdownIt({ html: true }).use(chromamark);
  md.render('::: fields\nA: <b>x</b>\n:::');
  assert.equal(md.options.html, true, 'html option must be restored');
});
