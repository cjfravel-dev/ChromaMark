# @chromamark/renderer

The ChromaMark renderer — a [`markdown-it`](https://github.com/markdown-it/markdown-it)
plugin that adds colored blocks, colored pills, collapsible sections, fields,
meters, and inline diff on top of CommonMark + GFM. Ships a browser bundle and a
theme stylesheet.

See the [ChromaMark spec](../../SPEC.md) for the full format.

## Install

```bash
npm install @chromamark/renderer
```

## Node / bundler API

```js
import chromamark, { render, renderGitHub, createRenderer } from '@chromamark/renderer';
```

TypeScript declarations ship with the Node and browser entry points; no separate
`@types` package is required.

| Export                    | Description                                                        |
| ------------------------- | ----------------------------------------------------------------- |
| `default` (`chromamark`)  | markdown-it plugin: `new MarkdownIt().use(chromamark, options?)`. |
| `render(src, options?)`   | Convenience: ChromaMark string → HTML fragment.                   |
| `createRenderer(options?)`| A `markdown-it` instance preconfigured with ChromaMark.           |
| `renderAnsi(src, opts?)`  | ChromaMark string → ANSI-styled text for a terminal.              |
| `renderGitHub(src, opts?)`| ChromaMark string → GitHub-native GFM.                            |
| `THEME_PRESETS`           | Safe built-in semantic color palettes.                            |
| `resolveTheme(theme?)`    | Validate a preset/config into known CSS variables.                |
| `applyTheme(target, theme?)` | Apply known variables to an Element or Document.              |
| `lint(src, opts?)`        | Check for common mistakes → array of `{ line, column, rule, … }`. |
| `LANGUAGE_VERSION`        | ChromaMark language contract implemented by this release.         |

`render()` and `createRenderer()` disable raw HTML for safe handling of
untrusted input. The plugin honors the host `MarkdownIt` instance's `html`
setting consistently; enable it only for trusted or separately sanitized input.

### Terminal rendering

`renderAnsi` walks the same parse into a TTY: tones become ANSI colors, pills
become bracketed icon chips (`[✓ PASS]`), blocks get a colored left bar, and
meters draw a unicode bar. It degrades to plain, icon-annotated text when color
is off.

```js
import { renderAnsi } from '@chromamark/renderer';

process.stdout.write(renderAnsi('::: success\nAll good [!ok healthy]\n:::'));
// options: { color: 'auto' | 'always' | 'never', width?: number }
```

Color defaults to `'auto'` — on when stdout is a TTY and [`NO_COLOR`](https://no-color.org)
is unset. The `colorEnabled(option, env?, isTTY?)` helper is exported too.

### GitHub-native rendering

`renderGitHub` maps callouts to GitHub Alerts, details to native `<details>`,
fields to GFM tables, pills to tone-aware `<kbd>` badges, and meters to portable
Unicode bars:

```js
import { renderGitHub } from '@chromamark/renderer';

const markdown = renderGitHub('::: success\nReady [!pass]\n:::');
```

Raw HTML is escaped by default. Pass `{ allowHtml: true }` only for trusted
repository-owned source. See the complete [mapping contract](../../docs/github-export.md).

### Options

All features are on by default; pass `false` to disable any of them:

```js
createRenderer({
  container: true, // ::: colored callouts
  details:   true, // ::: details collapsibles
  fields:    true, // ::: fields key/value lists
  pill:      true, // [!…] badges
  text:      true, // [.…] colored text
  meter:     true, // [=…] progress meters
  critic:    true, // {++…++} CriticMarkup diff
});
```

### Theme presets

Choose `github-light`, `github-dark`, `ocean`, `sunset`, or `monochrome`, with
optional validated semantic overrides:

```js
import { applyTheme } from '@chromamark/renderer';

applyTheme(document, {
  preset: 'ocean',
  tones: { success: { foreground: '#123456' } },
});
```

Only known tone/neutral slots and safe hex/plain-name colors are accepted; this
API does not accept arbitrary CSS. See the [theme guide](../../docs/themes.md).

### Fenced-code highlighting

ChromaMark stays dependency-free and lets callers supply any highlighter through
the standard markdown-it callback:

```js
const html = render(source, {
  highlight(code, language, attributes) {
    return yourHighlighter(code, language, attributes);
  },
});
```

The callback receives fence content, the language name, and trailing info-string
attributes. Its return value is trusted HTML, matching markdown-it behavior, so
escape or sanitize output from any highlighter that does not guarantee safe HTML.

## Browser API

The bundle in `dist/` embeds the parser **and** theme. Load it from a CDN:

```html
<!-- minified global build (window.ChromaMark) -->
<script src="https://cdn.jsdelivr.net/gh/cjfravel-dev/ChromaMark/packages/renderer/dist/chromamark.min.js"
        data-chromamark-auto></script>
```

Or import the ES module:

```js
import ChromaMark from '@chromamark/renderer/browser';
ChromaMark.autoRender();
```

| Method                         | Description                                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| `autoRender(options?)`         | Inject the theme, then render every target on the page.                |
| `renderElement(target, opts?)` | Render one element (selector or node) in place / as a sibling.         |
| `renderAll(selector?, opts?)`  | Render all matching elements.                                          |
| `renderSrc(target, opts?)`     | Fetch the element's `data-chromamark-src` file and render it in place. |
| `injectTheme(doc?)`            | Add the theme `<style>` once (idempotent).                             |
| `applyTheme(target, theme?)`   | Apply a safe preset/config to an Element or Document.                  |
| `render(src, opts?)`           | ChromaMark string → HTML.                                              |
| `theme`                        | The theme CSS as a string.                                             |
| `LANGUAGE_VERSION`           | ChromaMark language contract implemented by the bundle.               |

Targets default to `<script type="text/chromamark">`, `template.chromamark`,
`.chromamark`, `[data-chromamark]`, and `[data-chromamark-src]`. Adding
`data-chromamark-auto` to the loading `<script>` runs `autoRender()`
automatically once the DOM is ready.

Rendered meters expose `role="progressbar"` with bounded `aria-valuenow` and the
authored value in `aria-valuetext`, while retaining the visible meter label.

## Browser support

The browser bundles target ES2019 and require standard evergreen-browser APIs
such as `fetch`, `querySelectorAll`, and CSS custom properties. They do not
include legacy-browser polyfills.

Custom-color tinting uses `color-mix()` as a progressive enhancement. Browsers
without `color-mix()` retain the authored foreground color, transparent
background, and a visible current-color border as a fallback.

The minified CDN bundle has a 64 KiB gzip budget enforced by the repository test
suite. Applications with stricter budgets can use the Node/plugin API with their
existing `markdown-it` installation instead of the standalone browser bundle.

### Load ChromaMark from an external file

Point an element at a `.cm` file with `data-chromamark-src` and the bundle
fetches and renders it — the same idea as an external script or stylesheet, so
the page itself stays lean:

```html
<div data-chromamark-src="report.cm"></div>
<script src="https://cdn.jsdelivr.net/npm/@chromamark/renderer/dist/chromamark.min.js"
        data-chromamark-auto></script>
```

The file is fetched with `fetch()`, so the page must be served over `http(s)`
(not opened as `file://`) and same-origin/CORS rules apply. If the file can't be
loaded the element keeps its existing content and gets a `data-chromamark-error`
attribute, so a missing file degrades gracefully instead of throwing.

## Theme

The stylesheet is available standalone for cases where you render server-side and
want to ship the CSS via a `<link>`:

```js
import '@chromamark/renderer/theme.css';
```

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/cjfravel-dev/ChromaMark/packages/renderer/dist/chromamark.css">
```

Tones map to CSS custom properties (`--cm-success-fg`, …) and respond to
`prefers-color-scheme` or an explicit `data-theme="dark"` / `"light"` on a
container.

## Scripts

```bash
npm test    # node:test suite
npm run build   # esbuild → dist/chromamark.esm.js, dist/chromamark.min.js, dist/chromamark.css
```

## Credits

Inline change-tracking syntax is adopted from **[CriticMarkup](http://criticmarkup.com/)**
(© 2013 Gabe Weatherhead & Erik Hess, Apache-2.0); ChromaMark's parser is an original,
independent implementation. See the
[main README](https://github.com/cjfravel-dev/ChromaMark#prior-art--credits) for full credits.

## License

This software package is licensed under the [MIT License](./LICENSE.md). The
[ChromaMark specification](https://github.com/cjfravel-dev/ChromaMark/blob/main/LICENSE-SPEC.md)
is licensed separately under CC BY-SA 4.0.
