import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import MarkdownIt from 'markdown-it';
import Slim, {
  configureRenderer,
  configureTheme,
  configureMarkdownIt,
  injectTheme,
  render,
  renderElement,
} from '../src/browser-slim-core.js';

test('slim browser delegates rendering to a consumer-supplied function', () => {
  const calls = [];
  configureRenderer((source, options) => {
    calls.push([source, options]);
    return `<article>${source}</article>`;
  });
  assert.equal(render('hello', { custom: true }), '<article>hello</article>');
  assert.deepEqual(calls, [['hello', { custom: true }]]);
});

test('slim browser configures a consumer-supplied MarkdownIt instance with ChromaMark', () => {
  const md = configureMarkdownIt(new MarkdownIt({ html: false }));
  assert.equal(md.render('[!pass]'), '<p><span class="cm-pill" data-tone="success">PASS</span></p>\n');
  assert.equal(render('[!pass]'), '<p><span class="cm-pill" data-tone="success">PASS</span></p>\n');
});

test('slim browser renders DOM targets and injects its configured theme', () => {
  const dom = new JSDOM('<html><head></head><body><div id="report">source</div></body></html>');
  global.document = dom.window.document;
  configureRenderer((source) => `<strong>${source}</strong>`);
  configureTheme('.cm-test{color:red}');
  const output = renderElement('#report');
  assert.match(output.innerHTML, /<strong>source<\/strong>/);
  injectTheme(dom.window.document);
  assert.equal(dom.window.document.getElementById('chromamark-theme').textContent, '.cm-test{color:red}');
});

test('slim browser removes only the exact shared indentation prefix', () => {
  const dom = new JSDOM('<div id="mixed">\n\t  alpha\n\t\tbeta\n</div>');
  global.document = dom.window.document;
  let received;
  configureRenderer((source) => { received = source; return source; });
  renderElement('#mixed');
  assert.equal(received, '  alpha\n\tbeta');
});

test('slim global API exposes configuration and DOM hooks', () => {
  assert.equal(Slim.configureRenderer, configureRenderer);
  assert.equal(Slim.renderElement, renderElement);
  assert.equal(Slim.injectTheme, injectTheme);
});

test('configureRenderer rejects non-functions', () => {
  assert.throws(() => configureRenderer(null), /renderer must be a function/);
});
