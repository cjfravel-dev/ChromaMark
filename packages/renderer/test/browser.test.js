import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  renderElement,
  renderAll,
  renderSrc,
  injectTheme,
  configureTheme,
} from '../src/browser-core.js';
import * as browserApi from '../src/browser-core.js';

function setup(bodyHtml) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>${bodyHtml}</body></html>`);
  global.window = dom.window;
  global.document = dom.window.document;
  return dom;
}

test('browser API exposes the implemented ChromaMark language version', () => {
  assert.equal(browserApi.LANGUAGE_VERSION, '0.1');
  assert.equal(browserApi.ChromaMark.LANGUAGE_VERSION, browserApi.LANGUAGE_VERSION);
});

function stubFetch(dom, { ok = true, status = 200, body = '' } = {}) {
  const fn = async () => ({ ok, status, text: async () => body });
  dom.window.fetch = fn;
  global.fetch = fn;
}

test('renderElement renders a <script type=text/chromamark> holder into a sibling div', () => {
  setup('<script type="text/chromamark" id="s">::: success\nhi [!pass]\n:::</script>');
  const out = renderElement('#s');
  assert.ok(out, 'returns the output element');
  assert.match(out.innerHTML, /class="cm-block" data-tone="success"/);
  assert.match(out.innerHTML, /class="cm-pill" data-tone="success"/);
});

test('renderElement renders a <template class=chromamark> holder (content, not textContent)', () => {
  setup('<template class="chromamark" id="t">::: warning Note\nfrom template\n:::</template>');
  const out = renderElement('#t');
  assert.ok(out, 'returns the output element');
  assert.match(out.innerHTML, /class="cm-block" data-tone="warning"/);
  assert.match(out.innerHTML, /from template/);
});

test('renderElement renders a plain element in place and marks it', () => {
  setup('<div class="chromamark" id="d">::: info\nnote\n:::</div>');
  const out = renderElement('#d');
  assert.match(out.innerHTML, /class="cm-block" data-tone="info"/);
  assert.ok(out.classList.contains('chromamark-output'));
});

test('renderElement dedents indented source', () => {
  setup('<div class="chromamark" id="d">\n    ::: success\n    ok\n    :::\n  </div>');
  const out = renderElement('#d');
  assert.match(out.innerHTML, /class="cm-block" data-tone="success"/);
  assert.doesNotMatch(out.innerHTML, /<pre>/);
});

test('renderElement preserves tabs inside content (only strips leading indent)', () => {
  setup('<script type="text/chromamark" id="s">`a\tb`</script>');
  const out = renderElement('#s');
  assert.ok(out.innerHTML.includes('<code>a\tb</code>'), 'content tab is preserved, not turned into spaces');
});

test('renderElement dedents leading indentation while preserving inner tabs', () => {
  setup('<div class="chromamark" id="d">\n    ::: success\n    `x\ty`\n    :::\n  </div>');
  const out = renderElement('#d');
  assert.match(out.innerHTML, /class="cm-block" data-tone="success"/);
  assert.doesNotMatch(out.innerHTML, /<pre>/);
  assert.ok(out.innerHTML.includes('<code>x\ty</code>'), 'inner tab survives dedent of the leading indent');
});

test('renderAll renders all default targets and is idempotent', () => {
  setup(
    '<div class="chromamark">::: info\na\n:::</div>' +
      '<script type="text/chromamark">::: success\nb\n:::</script>' +
      '<template class="chromamark">::: danger\nc\n:::</template>',
  );
  const first = renderAll().filter(Boolean);
  assert.equal(first.length, 3);
  const second = renderAll().filter(Boolean);
  assert.equal(second.length, 0, 'already-rendered targets are skipped');
});

test('injectTheme adds the theme <style> exactly once', () => {
  const dom = setup('');
  configureTheme('.cm-block{color:red}');
  injectTheme();
  injectTheme();
  const styles = dom.window.document.querySelectorAll('#chromamark-theme');
  assert.equal(styles.length, 1);
  assert.match(styles[0].textContent, /cm-block/);
});

test('renderElement handles a detached <template> holder without crashing', () => {
  setup('');
  const tpl = document.createElement('template');
  tpl.content.textContent = '::: success\nok [!pass]\n:::';
  const out = renderElement(tpl); // detached: no parentNode
  assert.ok(out, 'returns the rendered output element');
  assert.match(out.innerHTML, /class="cm-block" data-tone="success"/);
});

test('renderElement handles a detached <script> holder without crashing', () => {
  setup('');
  const s = document.createElement('script');
  s.type = 'text/chromamark';
  s.textContent = '[!success OK]';
  const out = renderElement(s); // detached: no parentNode
  assert.ok(out, 'returns the rendered output element');
  assert.match(out.innerHTML, /class="cm-pill" data-tone="success"/);
});

test('renderElement uses the element ownerDocument, not a global one', () => {
  setup('<div id="host"></div>');
  const otherDom = new JSDOM('<!DOCTYPE html><html><body><script type="text/chromamark" id="s">[!info hi]</script></body></html>');
  const el = otherDom.window.document.getElementById('s');
  const out = renderElement(el);
  assert.ok(out);
  assert.equal(out.ownerDocument, otherDom.window.document, 'output belongs to the source document');
  assert.match(out.innerHTML, /class="cm-pill" data-tone="info"/);
});

test('renderSrc fetches an external .cm file and renders it into the element', async () => {
  const dom = setup('<div data-chromamark-src="profile.cm" id="p"></div>');
  stubFetch(dom, { body: '::: success\nhi [!ok pass]\n:::' });
  const el = await renderSrc('#p');
  assert.ok(el, 'resolves to the element');
  assert.match(el.innerHTML, /class="cm-block" data-tone="success"/);
  assert.match(el.innerHTML, /class="cm-pill" data-tone="success"/);
  assert.ok(el.classList.contains('chromamark-output'));
});

test('renderAll renders [data-chromamark-src] targets', async () => {
  const dom = setup('<div data-chromamark-src="x.cm" id="p"></div>');
  configureTheme('.cm-block{}');
  stubFetch(dom, { body: '[!info hello]' });
  await Promise.all(renderAll());
  assert.match(dom.window.document.getElementById('p').innerHTML, /class="cm-pill" data-tone="info"/);
});

test('renderSrc degrades gracefully when the fetch fails (no throw, records error)', async () => {
  const dom = setup('<div data-chromamark-src="missing.cm" id="p">original</div>');
  stubFetch(dom, { ok: false, status: 404, body: '' });
  const el = await renderSrc('#p');
  assert.equal(el, null, 'resolves null on failure');
  const node = dom.window.document.getElementById('p');
  assert.ok(node.hasAttribute('data-chromamark-error'), 'records an error marker');
  assert.match(node.textContent, /original/, 'leaves existing content in place');
});

test('renderSrc is idempotent (a second call is a no-op)', async () => {
  const dom = setup('<div data-chromamark-src="x.cm" id="p"></div>');
  stubFetch(dom, { body: '[!ok done]' });
  await renderSrc('#p');
  const second = await renderSrc('#p');
  assert.equal(second, null, 'already-rendered target is skipped');
});
