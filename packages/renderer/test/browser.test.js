import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  renderElement,
  renderAll,
  injectTheme,
  configureTheme,
} from '../src/browser-core.js';

function setup(bodyHtml) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>${bodyHtml}</body></html>`);
  global.window = dom.window;
  global.document = dom.window.document;
  return dom;
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
