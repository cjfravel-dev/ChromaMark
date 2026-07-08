import { test } from 'node:test';
import assert from 'node:assert/strict';
import MarkdownIt from 'markdown-it';
import { render } from '../src/index.js';
import chromamark from '../src/index.js';

const htmlTrue = () => new MarkdownIt({ html: true, linkify: true }).use(chromamark);

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

// ---- Inline constructs in titles & summaries ----

test('a container title renders inline ChromaMark pills', () => {
  const html = render('::: success Deploy [!ok healthy]\nbody\n:::');
  assert.match(
    html,
    /<div class="cm-title">Deploy <span class="cm-pill" data-tone="success">healthy<\/span><\/div>/,
  );
});

test('a details summary renders inline pills', () => {
  const html = render('::: details Failures [!fail 3]\nx\n:::');
  assert.match(
    html,
    /<summary>Failures <span class="cm-pill" data-tone="danger">3<\/span><\/summary>/,
  );
});

test('titles render standard markdown inline (bold, code)', () => {
  const html = render('::: info **Bold** and `code`\nx\n:::');
  assert.match(html, /<div class="cm-title"><strong>Bold<\/strong> and <code>code<\/code><\/div>/);
});

test('raw HTML in a title is escaped, not injected', () => {
  const html = render('::: warning <img src=x onerror=alert(1)> danger\nx\n:::');
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
});

test('a plain title still renders unchanged', () => {
  const html = render('::: success Deploy succeeded in 3m12s\nx\n:::');
  assert.match(html, /<div class="cm-title">Deploy succeeded in 3m12s<\/div>/);
});

test('a code fence inside a container is not closed early by a ::: line within it', () => {
  const html = render('::: success\n```\n:::\n```\n:::');
  assert.match(html, /<div class="cm-body"><pre><code>:::\n<\/code><\/pre>/);
  assert.doesNotMatch(html, /<\/div><\/div>\s*<pre>/);
});

test('a ChromaMark example shown in a fenced code block stays inside the container', () => {
  const html = render('::: info Example\n```\n::: success\nhi\n:::\n```\n:::');
  assert.match(html, /data-tone="info"/);
  assert.doesNotMatch(html, /data-tone="success"/);
  assert.match(html, /<pre><code>::: success\nhi\n:::\n<\/code><\/pre>/);
});

test('a ~~~ fence inside a container is also fence-aware', () => {
  const html = render('::: success\n~~~\n:::\n~~~\n:::');
  assert.match(html, /<div class="cm-body"><pre><code>:::\n<\/code><\/pre>/);
  assert.doesNotMatch(html, /<\/div><\/div>\s*<pre>/);
});

test('container bodies escape raw block HTML even on an html:true host', () => {
  const html = htmlTrue().render('::: success\n<img src=x onerror=alert(1)>\n:::');
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
});

test('inline raw HTML in a container body is escaped on an html:true host', () => {
  const html = htmlTrue().render('::: info\ntext <b>bold</b> more\n:::');
  assert.doesNotMatch(html, /<b>bold<\/b>/);
  assert.match(html, /&lt;b&gt;bold&lt;\/b&gt;/);
});

test('details bodies also escape raw HTML on an html:true host', () => {
  const html = htmlTrue().render('::: details Summary\n<script>alert(1)</script>\n:::');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test('raw HTML outside a container still passes through on an html:true host', () => {
  const html = htmlTrue().render('<div>outside</div>\n\n::: success\n<b>in</b>\n:::');
  assert.match(html, /<div>outside<\/div>/);
  assert.match(html, /&lt;b&gt;in&lt;\/b&gt;/);
});
