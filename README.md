<p align="center">
  <img src="docs/assets/chromamark-black.png" alt="ChromaMark" width="320">
</p>

[![CI](https://github.com/cjfravel-dev/ChromaMark/actions/workflows/ci.yml/badge.svg)](https://github.com/cjfravel-dev/ChromaMark/actions/workflows/ci.yml)
[![npm renderer](https://img.shields.io/npm/v/@chromamark/renderer?label=npm%20renderer)](https://www.npmjs.com/package/@chromamark/renderer)
[![npm cli](https://img.shields.io/npm/v/@chromamark/cli?label=npm%20cli)](https://www.npmjs.com/package/@chromamark/cli)
[![PyPI](https://img.shields.io/pypi/v/chromamark?label=pypi)](https://pypi.org/project/chromamark/)
[![VS Code Marketplace](https://vsmarketplacebadges.dev/version-short/chromamark.chromamark-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=chromamark.chromamark-vscode)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20SaaS-blue)](LICENSE.md)

**A lean rich-markup for agent-to-human communication.** ChromaMark is a strict
superset of Markdown (CommonMark + GFM) that adds the three things agents
actually need to communicate clearly — **colored blocks**, **colored pills**, and
**collapsible sections** — plus a few opt-in extensions. It costs a fraction of
the tokens of equivalent HTML and degrades to readable plain text anywhere it
isn't natively rendered.

> Markdown can't color a callout or render a `PASS`/`FAIL` badge. HTML can, but
> `<span class="pill pill--ok">PASS</span>` burns 12 tokens per badge and reads
> terribly when unrendered. ChromaMark gets you both — cheap and legible.

Same rendered badge, counted with the `o200k_base` tokenizer (GPT-4o/4.1/5-class):

| Same `PASS` badge | Source                                    | Tokens |
| ----------------- | ----------------------------------------- | ------ |
| ChromaMark pill   | `[!ok PASS]`                              | **5**  |
| HTML span         | `<span class="pill pill--ok">PASS</span>` | 12     |

A colored callout shows the same ratio — `::: success` / body / `:::` is 10 tokens
versus 22 for the `<div class="callout…">…</div>` equivalent — and it compounds
across a status-heavy report.

📄 **[Read the spec](./SPEC.md)** · 📐 **[Grammar](./docs/grammar.ebnf)** · 🎨 **[Playground](https://cjfravel-dev.github.io/ChromaMark/playground/)** · 🖼️ **[Gallery](https://cjfravel-dev.github.io/ChromaMark/gallery.html)**

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

Keep the page lean by loading the ChromaMark from an external file — like an
external script or stylesheet — with `data-chromamark-src`:

```html
<div data-chromamark-src="report.cm"></div>
<script src=".../chromamark.min.js" data-chromamark-auto></script>
```

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
backticks** — `` `[!pass]` `` renders as literal code, not a pill. Guard against
that (and other silent mistakes) in CI with [`chromamark lint`](#command-line).

## Built for streaming

Agents emit token-by-token and sometimes get cut off mid-thought. ChromaMark is
designed so a **truncated** document still renders cleanly — no HTML-style broken
tags, no lost content:

- An unclosed `::: success` block auto-closes at end of input and still renders in full.
- A half-written pill like `[!pass` degrades to readable literal text, not garbage.
- Every construct's opener precedes its content, so a renderer can begin styling
  with no lookahead.

This is the thing HTML can't do gracefully and plain Markdown can't do at all. See
the streaming contract in [SPEC §12](./SPEC.md).

## Safety & sanitization

Agent output is untrusted input, so ChromaMark is safe by default:

- **Raw HTML is escaped, not injected.** The renderer runs markdown-it with
  `html: false`, and block titles, `::: fields`, and container bodies are
  force-escaped even when attached to a host that enables raw HTML — so a
  `<script>` in agent output renders as literal text.
- **No CSS injection.** `color=` accepts only hex literals or plain color names;
  functional forms (e.g. `url(...)`, `expression(...)`) are rejected.
- **No script execution.** No construct requires or permits `<script>`, event
  handlers, or `javascript:` URLs.

Details in [SPEC §2–3](./SPEC.md).

## Command line

Compile `.cm` files to **self-contained HTML** (theme inlined, no CDN) with
[`@chromamark/cli`](./packages/cli):

```bash
npx @chromamark/cli build report.cm        # → report.html
npx @chromamark/cli build docs/ -o site/   # a whole tree
```

Or render straight to a **color terminal** — tones become ANSI colors, pills
become bracketed icon chips (`[✓ PASS]`), blocks get a colored left bar. Handy
for CI logs and agent CLIs; honors [`NO_COLOR`](https://no-color.org):

```bash
npx @chromamark/cli render report.cm       # ANSI to your terminal
cat report.cm | npx @chromamark/cli render # from stdin
```

Or **lint** a document in CI to catch the mistakes the format otherwise hides
silently — a pill wrapped in backticks, a typo'd tone, an unclosed block:

```bash
npx @chromamark/cli lint report.cm         # exits non-zero on problems
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
├── docs/                       llms.txt, grammar.ebnf, integrations roadmap, logo assets
├── conformance/                shared JS/Python rendering contract
├── examples/demo.cm            a sample document exercising every construct
├── packages/
│   ├── renderer/               @chromamark/renderer — parser, theme, ANSI, lint, browser bundle
│   ├── cli/                    @chromamark/cli — build (HTML), render (ANSI), lint
│   ├── python/                 chromamark (pip) — renderer, builder, Jupyter
│   └── vscode/                 chromamark-vscode — preview + highlighting
├── eval/                       LLM-conformance eval harness (measures llms.txt)
└── scripts/build-site.mjs      builds the GitHub Pages site
```

## Development

```bash
npm install
npm test                                     # renderer test suite (node:test)
npm test --workspace @chromamark/cli         # CLI tests (build, render, lint)
npm run test:eval                            # eval harness tests
npm run eval                                 # offline LLM-conformance demo
npm run build --workspace @chromamark/renderer   # bundle dist/ for the browser/CDN
npm run build:site                           # build the Pages site into _site/
```

## Prior art & credits

ChromaMark builds on well-designed standards rather than reinventing them:

- **[CommonMark](https://commonmark.org/) + [GitHub Flavored Markdown](https://github.github.com/gfm/)** — the base syntax ChromaMark is a strict superset of.
- **[CriticMarkup](http://criticmarkup.com/)** (© 2013 Gabe Weatherhead & Erik Hess, Apache-2.0) — the inline change-tracking syntax (`{++add++}`, `{--del--}`, `{~~a~>b~~}`) ChromaMark adopts for diffs. Our parser is an original, independent implementation.
- **[markdown-it](https://github.com/markdown-it/markdown-it)** and **[markdown-it-py](https://github.com/executablebooks/markdown-it-py)** — the pluggable Markdown engines the JS and Python renderers extend.

## License

Modified MIT License with a SaaS source-availability provision — see [LICENSE.md](./LICENSE.md).
