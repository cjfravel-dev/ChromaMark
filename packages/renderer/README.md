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
import chromamark, { render, createRenderer } from '@chromamark/renderer';
```

| Export                    | Description                                                        |
| ------------------------- | ----------------------------------------------------------------- |
| `default` (`chromamark`)  | markdown-it plugin: `new MarkdownIt().use(chromamark, options?)`. |
| `render(src, options?)`   | Convenience: ChromaMark string → HTML fragment.                   |
| `createRenderer(options?)`| A `markdown-it` instance preconfigured with ChromaMark.           |

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
| `injectTheme(doc?)`            | Add the theme `<style>` once (idempotent).                             |
| `render(src, opts?)`           | ChromaMark string → HTML.                                              |
| `theme`                        | The theme CSS as a string.                                             |

Targets default to `<script type="text/chromamark">`, `template.chromamark`,
`.chromamark`, and `[data-chromamark]`. Adding `data-chromamark-auto` to the
loading `<script>` runs `autoRender()` automatically once the DOM is ready.

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

## License

Modified MIT License with a SaaS source-availability provision — see [LICENSE.md](./LICENSE.md).
