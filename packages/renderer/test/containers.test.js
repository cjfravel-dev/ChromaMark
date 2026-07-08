import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/index.js';

test('a bare tone container renders a colored block with a default title', () => {
  const html = render('::: success\nAll 247 tests passed.\n:::');
  assert.match(html, /<div class="cm-block" data-tone="success">/);
  assert.match(html, /<div class="cm-title">Success<\/div>/);
  assert.match(html, /<div class="cm-body">\s*<p>All 247 tests passed\.<\/p>/);
});

test('a container title overrides the default and body parses markdown', () => {
  const html = render('::: warning Deprecation\nUse `query_parameters` instead.\n:::');
  assert.match(html, /data-tone="warning"/);
  assert.match(html, /<div class="cm-title">Deprecation<\/div>/);
  assert.match(html, /<code>query_parameters<\/code>/);
});

test('tone aliases work as container kinds', () => {
  const html = render('::: fail Boom\nnope\n:::');
  assert.match(html, /data-tone="danger"/);
  assert.match(html, /<div class="cm-title">Boom<\/div>/);
});

test('block kind with color= renders a custom-colored block via --fg', () => {
  const html = render('::: block color=#6f42c1 Custom hue\nhi\n:::');
  assert.match(html, /class="cm-block cm-custom"/);
  assert.match(html, /style="--fg:#6f42c1"/);
  assert.match(html, /<div class="cm-title">Custom hue<\/div>/);
});

test('block kind without a title omits the title element', () => {
  const html = render('::: block color=#0f7b6c\nbody\n:::');
  assert.doesNotMatch(html, /cm-title/);
  assert.match(html, /<div class="cm-body">\s*<p>body<\/p>/);
});

test('details renders a collapsed <details> with a summary', () => {
  const html = render('::: details Stack trace\nline one\n:::');
  assert.match(html, /<details class="cm-details">/);
  assert.match(html, /<summary>Stack trace<\/summary>/);
  assert.match(html, /<div class="cm-body">\s*<p>line one<\/p>/);
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
});

test('details supports the open flag and a tone', () => {
  const html = render('::: details open warning 12 lint warnings\n- a\n- b\n:::');
  assert.match(html, /<details class="cm-details" data-tone="warning" open>/);
  assert.match(html, /<summary>12 lint warnings<\/summary>/);
  assert.match(html, /<li>a<\/li>/);
});

test('fields renders a definition list with inline-rendered values', () => {
  const html = render('::: fields\nRegion: eastus\nStatus: [!ok healthy]\n:::');
  assert.match(html, /<dl class="cm-fields">/);
  assert.match(html, /<dt>Region<\/dt>\s*<dd>eastus<\/dd>/);
  assert.match(html, /<dt>Status<\/dt>\s*<dd><span class="cm-pill" data-tone="success">healthy<\/span><\/dd>/);
});

test('containers nest when the outer fence uses more colons', () => {
  const src = [
    ':::: danger Release blocked',
    'Two gates failed:',
    '',
    '::: details Gate 1',
    'FAILED test_a',
    ':::',
    '::::',
  ].join('\n');
  const html = render(src);
  assert.match(html, /<div class="cm-block" data-tone="danger">/);
  assert.match(html, /<details class="cm-details">/);
  assert.match(html, /<summary>Gate 1<\/summary>/);
  // the inner block must close before the outer block
  const innerClose = html.indexOf('</details>');
  const outerClose = html.lastIndexOf('</div>');
  assert.ok(innerClose > -1 && innerClose < outerClose);
});

test('an unknown container kind is left as literal text (graceful degradation)', () => {
  const html = render('::: bogus\nhi\n:::');
  assert.match(html, /::: bogus/);
  assert.doesNotMatch(html, /cm-block/);
});
