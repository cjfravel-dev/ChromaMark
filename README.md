# ChromaMark

**A lean rich-markup for agent-to-human communication.** ChromaMark is a strict
superset of Markdown (CommonMark + GFM) that adds the three things agents
actually need to communicate clearly — **colored blocks**, **colored pills**, and
**collapsible sections** — plus a few opt-in extensions. It costs a fraction of
the tokens of equivalent HTML and degrades to readable plain text anywhere it
isn't natively rendered.

> Markdown can't color a callout or render a `PASS`/`FAIL` badge. HTML can, but
> `<span class="pill pill--ok">PASS</span>` burns ~9 tokens per badge and reads
> terribly when unrendered. ChromaMark gets you both — cheap and legible.

📄 **[Read the spec](./SPEC.md)** · 🎨 **[Live demo](./examples/index.html)** (open in a browser)

## What it looks like

```chromamark
::: success Deploy succeeded in 3m12s
Region `eastus`, 3/3 replicas [!ok healthy].
:::

Build [!pass] · lint [!warn 12] · coverage [=success 87%]

::: details danger Integration failures (3)
FAILED test_recon_merge_precedence — expected config to win
:::
```

| Feature            | Syntax                          |
| ------------------ | ------------------------------- |
| Colored block      | `::: warning Title … :::`       |
| Colored pill       | `[!success PASS]`, `[!fail 3]`  |
| Collapsible        | `::: details open Summary … :::`|
| Fields (key/value) | `::: fields … :::`              |
| Colored text       | `[.danger critical]`            |
| Progress meter     | `[=success 87%]`                |
| Inline diff        | `{++add++}` `{--del--}` `{~~a~>b~~}` |

Everything draws from one semantic color vocabulary — `success`/`ok`/`pass`,
`danger`/`error`/`fail`, `warning`/`warn`, `info`/`note`, `tip`/`hint`,
`muted`/`skip` — with a `color=#hex` escape hatch. Colors are **theme-owned**, so
output adapts to light/dark automatically.

## Quick start (webpage)

One CDN import and an attribute — the library injects its own theme and renders
every target. No build step, no CSS to copy.

```html
<script src="https://cdn.jsdelivr.net/gh/cjfravel-dev/ChromaMark/packages/renderer/dist/chromamark.min.js"
        data-chromamark-auto></script>

<div class="chromamark">
::: success
All 247 tests passed.
:::
</div>
```

Prefer to drive it yourself? Skip `data-chromamark-auto` and call the hook:

```html
<script src=".../chromamark.min.js"></script>
<script>
  ChromaMark.injectTheme();            // add the stylesheet once
  ChromaMark.renderElement('#report'); // render a specific section
</script>
```

Auto-render targets any `<script type="text/chromamark">`, `.chromamark`, or
`[data-chromamark]` element on the page.

## Quick start (Node / bundler)

```bash
npm install @chromamark/renderer
```

```js
import { render } from '@chromamark/renderer';        // string → HTML
const html = render('::: success\nAll good [!ok pass]\n:::');

// …or as a markdown-it plugin:
import MarkdownIt from 'markdown-it';
import chromamark from '@chromamark/renderer';
const md = new MarkdownIt().use(chromamark);
```

## VS Code

The [`chromamark-vscode`](./packages/vscode) extension renders ChromaMark in the
built-in Markdown preview and highlights its syntax. `.cm` / `.cmd` files are
treated as Markdown. Press <kbd>F5</kbd> from the repo to try it.

## Repository layout

```
ChromaMark/
├── SPEC.md                     the specification (written in ChromaMark)
├── examples/                   demo.cm + generated client-side pages
├── packages/
│   ├── renderer/               @chromamark/renderer — parser, theme, browser bundle
│   └── vscode/                 chromamark-vscode — preview + highlighting
└── scripts/build-examples.mjs  regenerates the example pages
```

## Development

```bash
npm install
npm test                                     # renderer test suite (node:test)
npm run build --workspace @chromamark/renderer   # bundle dist/ for the browser/CDN
npm run build:examples                       # regenerate examples/*.html
```

## License

[MIT](./LICENSE)
