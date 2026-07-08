<p align="center">
  <img src="docs/assets/chromamark-black.png" alt="ChromaMark" width="320">
</p>

[![License](https://img.shields.io/badge/license-MIT%20%2B%20SaaS-blue)](LICENSE.md)

**A lean rich-markup for agent-to-human communication.** ChromaMark is a strict
superset of Markdown (CommonMark + GFM) that adds the three things agents
actually need to communicate clearly — **colored blocks**, **colored pills**, and
**collapsible sections** — plus a few opt-in extensions. It costs a fraction of
the tokens of equivalent HTML and degrades to readable plain text anywhere it
isn't natively rendered.

> Markdown can't color a callout or render a `PASS`/`FAIL` badge. HTML can, but
> `<span class="pill pill--ok">PASS</span>` burns ~9 tokens per badge and reads
> terribly when unrendered. ChromaMark gets you both — cheap and legible.

📄 **[Read the spec](./SPEC.md)** · 🎨 **[Playground](https://cjfravel-dev.github.io/ChromaMark/playground/)** · 🖼️ **[Gallery](https://cjfravel-dev.github.io/ChromaMark/gallery.html)**

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
built-in Markdown preview and highlights its syntax. `.cm` files are
treated as Markdown. Press <kbd>F5</kbd> from the repo to try it.

## For LLMs & agents

ChromaMark is designed to be emitted by AI agents as plain text. Drop
[`docs/llms.txt`](./docs/llms.txt) into a system prompt to teach a model the full
syntax in a few hundred tokens. One gotcha worth repeating: **don't wrap pills in
backticks** — `` `[!pass]` `` renders as literal code, not a pill.

## Command line

Compile `.cm` files to **self-contained HTML** (theme inlined, no CDN) with
[`@chromamark/cli`](./packages/cli):

```bash
npx @chromamark/cli build report.cm        # → report.html
npx @chromamark/cli build docs/ -o site/   # a whole tree
```

## Python & Jupyter

The [`chromamark`](./packages/python) Python package renders ChromaMark to the
same HTML and displays it inline in notebooks:

```python
from chromamark import display_chromamark, ChromaDoc
display_chromamark("::: success\nRun complete [=success 100%]\n:::")
```

## Repository layout

```
ChromaMark/
├── SPEC.md                     the specification (written in ChromaMark)
├── docs/                       llms.txt, integrations roadmap, logo assets
├── examples/demo.cm            a sample document exercising every construct
├── packages/
│   ├── renderer/               @chromamark/renderer — parser, theme, browser bundle
│   ├── cli/                    @chromamark/cli — .cm → self-contained HTML
│   ├── python/                 chromamark (pip) — renderer, builder, Jupyter
│   └── vscode/                 chromamark-vscode — preview + highlighting
└── scripts/build-site.mjs      builds the GitHub Pages site
```

## Development

```bash
npm install
npm test                                     # renderer test suite (node:test)
npm run build --workspace @chromamark/renderer   # bundle dist/ for the browser/CDN
npm run build:site                           # build the Pages site into _site/
```

## License

Modified MIT License with a SaaS source-availability provision — see [LICENSE.md](./LICENSE.md).
