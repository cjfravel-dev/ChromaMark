import { test } from 'node:test';
import assert from 'node:assert/strict';
import MarkdownIt from 'markdown-it';
import chromamark from '../src/index.js';

test('fields values preserve raw HTML on an html:true markdown-it instance', () => {
  const md = new MarkdownIt({ html: true }).use(chromamark);
  const out = md.render('::: fields\nStatus: <kbd>ready</kbd>\n:::');
  assert.match(out, /<dd><kbd>ready<\/kbd><\/dd>/);
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
