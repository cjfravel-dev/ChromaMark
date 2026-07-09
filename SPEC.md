# ChromaMark Specification

> **Base dialect:** CommonMark + GFM (tables, strikethrough, autolinks)
> **File extensions:** `.cm` · **Info-string / fence tag:** `chromamark`
>
> _This document is written **in ChromaMark**. On a plain markdown viewer (e.g._
> _GitHub) the ChromaMark constructs degrade to readable text; for the full_
> _experience render it with `@chromamark/renderer` or try the_
> _[playground](https://cjfravel-dev.github.io/ChromaMark/playground/)._

---

::: info The one-paragraph pitch
ChromaMark is a **strict superset of CommonMark + GFM** that adds the three
things agents actually need to communicate clearly — **colored blocks**,
**colored inline pills**, and **collapsible sections** — plus a small set of
opt-in extensions. It costs a fraction of the tokens of equivalent HTML and
degrades to readable plain text anywhere it isn't natively rendered.
:::

## 1 · Why

Agents stream a lot of status: pass/fail, warnings, diffs, long logs. The two
existing options both hurt:

- **Markdown** can't color a callout, can't render a `PASS`/`FAIL` pill, and
  can't hide a 300-line stack trace behind a toggle.
- **HTML** can do all of it, but `<span class="pill pill--ok">PASS</span>` burns
  ~9 tokens for one badge, invites unsafe raw markup, and reads terribly when a
  tool _doesn't_ render it.

ChromaMark adds exactly those capabilities with the cheapest, least-ambiguous
syntax we could find.

## 2 · Design principles

1. **Superset of CommonMark + GFM.** Every valid GFM document is valid
   ChromaMark and renders identically, with one deliberate exception: raw HTML
   is escaped rather than passed through (§3), preserving principle 5's safety.
   We only add; we never redefine.
2. **Token-lean.** Each construct is measured against its HTML equivalent; if it
   isn't meaningfully cheaper, it doesn't earn a place.
3. **Graceful degradation.** Under a plain markdown engine — or read as raw text
   — every construct stays legible. No construct hides its own content.
4. **Streaming-friendly.** Every construct's _opener_ precedes its content, so a
   renderer can begin styling with no lookahead — critical for token-by-token
   agent output.
5. **Unambiguous & safe.** Reserved sigils never collide with CommonMark, and no
   feature requires raw HTML or script execution.
6. **Theme-owned color.** Authors pick _semantic_ colors by default; the renderer
   theme maps them to real values, so output stays correct in light/dark and
   never clashes.

## 3 · Relationship to CommonMark & GFM

ChromaMark **is** CommonMark + GFM. Everything in the
[CommonMark spec](https://spec.commonmark.org/) and the
[GFM extensions](https://github.github.com/gfm/) (tables, strikethrough,
autolinks) works unchanged — **except that raw HTML is disabled for safety**:
inline and block HTML are escaped and shown as literal text, never injected
(principle 5). ChromaMark reserves three previously inert lexical niches:

| Sigil            | ChromaMark meaning        | In plain CommonMark it was… |
| ---------------- | ------------------------- | --------------------------- |
| `:::` at line start | container fence        | literal text                |
| `[!` … `]`       | inline pill / text / meter | literal text               |
| `{++`, `{--`, `{~~`, `{==` | CriticMarkup diff | literal text                |

Because each was previously meaningless, no existing document changes meaning.

## 4 · The color vocabulary

Blocks, pills, text, and meters all draw from **one** vocabulary, so there is a
single thing to learn.

| Semantic token | Aliases         | Default hue | Meaning                 |
| -------------- | --------------- | ----------- | ----------------------- |
| `success`      | `ok`, `pass`    | green       | good / passed / done    |
| `danger`       | `error`, `fail` | red         | bad / failed / blocking |
| `warning`      | `warn`          | amber       | caution / non-blocking  |
| `info`         | `note`          | blue        | neutral information     |
| `tip`          | `hint`          | teal        | advice / suggestion     |
| `muted`        | `skip`          | gray        | de-emphasized / skipped |

::: tip Semantic first, hex as escape hatch
Prefer semantic tokens — they respect the reader's theme. When a token genuinely
won't do, use the escape hatch **`color=<name>`** or **`color=#RRGGBB`**
(e.g. `color=#6f42c1`). Explicit colors are literal and bypass theming.
:::

## 5 · Colored blocks — `:::`

Fenced containers, aligned with the widely-used `:::` admonition convention
(Pandoc, markdown-it-container, Docusaurus) so existing tooling gets you partway.

```chromamark
::: <kind> [attrs] [title]
…block content (markdown, may nest)…
:::
```

- **kind** — a semantic token from §4 (`note`, `tip`, `info`, `warning`,
  `danger`, `success`, `muted`), or `block` for a color-only container, or a
  structural kind (`details` §7, `fields` §8.1).
- **attrs** — optional `key=value` tokens or flags _immediately_ after the kind.
  Recognized: `color=…` (override hue) and `open` (details only). Attribute
  parsing stops at the first token that is neither `key=value` nor a known flag.
- **title** — the remainder of the opener line; optional. Rendered as **inline
  content**, so it may contain pills, colored text, meters, inline diff, and
  ordinary markdown (`**bold**`, `` `code` ``, links). Raw HTML in a title is
  escaped, not injected.

**Live examples** (these render as real callouts above/below):

```chromamark
::: success Deploy [!ok healthy] · 3/3 replicas
All 247 tests passed.
:::

::: warning Deprecation
`recon.flights` is removed in v3. Use `query_parameters` instead.
:::

::: block color=#6f42c1 Custom hue
Only when a semantic token won't do.
:::
```

::: danger Fallback behavior
On a plain markdown engine a colored block degrades to its literal `:::` lines —
the title and body text remain readable and nothing is hidden.
:::

## 6 · Colored pills — `[!…]`

Inline badges. The reserved opener **`[!`** starts a pill and never collides with
CommonMark (there, `[!x]` is just literal text — exactly the fallback we want).

```chromamark
[!<token-or-color> <label>]
```

- **token-or-color** — a semantic token (§4), a bare `#hex`, or `color=<hex|name>`.
  (Bare CSS color _names_ are only accepted via `color=` so they can't be mistaken
  for a label word.)
- **label** — free text up to the closing `]`. If omitted, the token name is the
  label (uppercased): `[!pass]` → `PASS`.

Build [!success PASS] · lint [!warn 12 issues] · deploy [!danger FAILED] ·
coverage [!info 87%] · flaky [!muted SKIPPED] · tag [!color=#6f42c1 beta]

Pills shine in tables:

| Suite       | Result          | Time  |
| ----------- | --------------- | ----- |
| unit        | [!pass]         | 4.1s  |
| integration | [!fail 3 of 88] | 61.0s |
| e2e         | [!skip]         | —     |

Fallback: renders as the literal bracketed text, e.g. `[!success PASS]`, which
still communicates status.

## 7 · Collapsible sections — `::: details`

A container kind, so it is block-level and streaming-friendly (the summary sits
on the opener line, before the hidden body).

```chromamark
::: details [open] [tone] <summary>
…hidden content (markdown, may nest)…
:::
```

- Collapsed by default; add the `open` flag to start expanded.
- An optional semantic token colors the header, e.g. `::: details danger …`.
- The **summary** renders as inline content (pills, colored text, meters, and
  markdown all work), the same as a block title.

```chromamark
::: details danger Integration failures [!fail 3 of 88]
FAILED test_recon_merge_precedence — expected config to win
:::
```

::: details A real collapsible — click to expand
This body is hidden until you expand it. It may contain **any** markdown,
including nested blocks and code fences.
:::

Fallback: renders as a real `<details>`/`<summary>` where supported. On a plain
markdown engine it degrades to its literal `:::` lines — the summary and body
remain readable, and content is **never** hidden in a non-supporting renderer
(principle 3).

## 8 · Extensions

The inline sigil family is deliberately uniform — one rule to learn:

| Sigil     | Construct              | Fill?          |
| --------- | ---------------------- | -------------- |
| `[!…]`    | pill / badge           | filled         |
| `[.…]`    | colored text           | tint, no fill  |
| `[=…]`    | progress / meter       | bar            |

### 8.1 · Fields (key/value) — `::: fields`

Agents emit key/value status constantly. A `fields` block renders as a compact
definition list.

```chromamark
::: fields
Region: eastus
Replicas: 3/3
Commit: `25d7426`
Status: [!ok healthy]
:::
```

### 8.2 · Inline colored text — `[.…]`

Tinted words with **no** badge background — for prose emphasis.

```chromamark
The gate is [.success green] but the [.danger critical] path is [.warning slow].
```

The gate is [.success green] but the [.danger critical] path is [.warning slow].

### 8.3 · Progress meter — `[=…]`

```chromamark
Coverage [=success 87%]   Budget [=warning 72%]   Disk [=danger 96%]   Tasks [=info 3/10]
```

The label is the displayed value; a trailing `NN%` or `A/B` sets the fill.

### 8.4 · Diff — GFM `diff` block + inline CriticMarkup

Block-level diffs use the existing GFM fenced ` ```diff ` convention. For inline
change-tracking, ChromaMark adopts **[CriticMarkup](http://criticmarkup.com/)**
(© 2013 Gabe Weatherhead & Erik Hess) rather than inventing syntax:

| CriticMarkup      | Meaning   |
| ----------------- | --------- |
| `{++insert++}`    | insertion |
| `{--delete--}`    | deletion  |
| `{~~old~>new~~}`  | substitution |
| `{==highlight==}` | highlight / mark |
| `{>>comment<<}`   | comment   |

The field was {--flights--}{++query_parameters++} and is {==worth reviewing==}
before merge.

## 9 · Nesting

Containers nest. Use **more colons** for the outer fence so boundaries are
unambiguous:

```chromamark
:::: danger Release blocked
Two gates failed:

::: details Failing gate 1 — tests
FAILED test_recon_merge_precedence
:::

::: details Failing gate 2 — coverage
Coverage 71% < 80% threshold.
:::
::::
```

Pills, text, and meters nest freely inside any block, list, heading, or table cell.

## 10 · Escaping

- `\:::` at the start of a line → a literal `:::`.
- `\[!`, `\[.`, `\[=` → literal openers.
- Inside a fenced **code** block nothing is interpreted (as in CommonMark), so
  examples of ChromaMark syntax are safe.

## 11 · Graceful degradation summary

| Construct     | ChromaMark          | Plain-markdown fallback                       |
| ------------- | ------------------- | --------------------------------------------- |
| Colored block | `::: warning Title` | literal `:::` lines; title + body readable    |
| Pill          | `[!success PASS]`   | literal text `[!success PASS]`                |
| Collapsible   | `::: details Sum…`  | literal `:::` lines; summary + body readable  |
| Colored text  | `[.danger x]`       | literal text `[.danger x]`                    |
| Meter         | `[=success 87%]`    | literal text `[=success 87%]`                 |
| Fields        | `::: fields`        | literal `:::` lines of `key: value`           |

Nothing is ever _hidden_ or _lost_ when unsupported — a non-ChromaMark engine
shows the literal source, which stays readable. Renderers MAY present richer
fallbacks (e.g. a blockquote), but that is not required.

## 12 · Streaming behavior

Because every opener precedes its content and every inline construct is
self-delimiting, a renderer can:

- Begin a colored block the instant it sees the `:::` opener line.
- Draw a pill as soon as `]` arrives (typically within one or two tokens).
- Render a collapsible's summary immediately, filling the body as it streams.

No construct requires seeing its end before it can begin styling.

## 13 · Grammar sketch (EBNF-ish)

::: info Full grammar
The sketch below is a quick overview. The complete, normative EBNF for the
extension layer — kept in sync with the parser by a test — lives in
[`docs/grammar.ebnf`](./docs/grammar.ebnf). Use it to build third-party tooling
(editors, validators, tree-sitter grammars) without reimplementing the parser.
:::

```
document     = { gfm-block | container } ;
container    = fence-open , newline , { line } , fence-close ;
fence-open   = ":" , ":" , { ":" } , ws , kind , [ ws , attrs ] , [ ws , title ] ;
fence-close  = ":" , ":" , { ":" } ;              (* >= opener's colon count *)
kind         = tone | "block" | "details" | "fields" ;
tone         = "success" | "danger" | "warning" | "info" | "tip" | "muted" | alias ;
attrs        = { attr , ws } ;
attr         = "color=" , colorval | "open" ;
colorval     = hexcolor | named-color ;
hexcolor     = "#" , ( 3 | 6 | 8 ) * hexdig ;

pill         = "[" , "!" , spec , [ ws , label ] , "]" ;
text         = "[" , "." , spec , ws , label , "]" ;
meter        = "[" , "=" , spec , ws , value , "]" ;
spec         = tone | "color=" , colorval | hexcolor ;
label        = { any-char-except-"]" } ;
value        = number , [ "%" ] | number , "/" , number ;

critic       = "{++" , text , "++}" | "{--" , text , "--}"
             | "{~~" , text , "~>" , text , "~~}" | "{==" , text , "==}"
             | "{>>" , text , "<<}" ;
```

## 14 · Conformance levels

::: fields
Level 0 — Text: valid CommonMark+GFM; degrades all ChromaMark constructs. Any existing renderer.
Level 1 — Static: renders colored blocks, pills, text, meters, fields; collapsibles shown expanded.
Level 2 — Interactive: adds real collapse/expand and streaming styling.
:::

## 15 · Reference implementations

::: fields
Renderer: `@chromamark/renderer` — a markdown-it plugin (`packages/renderer`). Works in any webpage; ships the CSS theme.
VS Code: `chromamark-vscode` — reuses the renderer in the built-in markdown preview and adds syntax highlighting (`packages/vscode`).
Demo: the [playground](https://cjfravel-dev.github.io/ChromaMark/playground/) and [gallery](https://cjfravel-dev.github.io/ChromaMark/gallery.html) — a rendered reference of every construct with a light/dark toggle.
:::

---

## Appendix · A realistic agent report

```chromamark
## Deploy report — `service-recon` @ 25d7426

:::: success Deploy succeeded in 3m12s
::: fields
Region: eastus
Replicas: 3/3 [!ok healthy]
Coverage: [=success 87%]
:::
::::

| Stage  | Result          | Notes           |
| ------ | --------------- | --------------- |
| build  | [!pass]         | cached          |
| unit   | [!pass 247]     | 4.1s            |
| integ  | [!fail 3 of 88] | see trace below |
| lint   | [!warn 12]      | non-blocking    |
| deploy | [!pass]         | 3m12s           |

::: details danger Integration failures (3)
FAILED test_recon_merge_precedence — expected config to win
FAILED test_query_parameters_map  — key casing mismatch
FAILED test_seller_ids_removed    — legacy field still referenced
:::

Overall: [!warn SHIP WITH CAUTION]
```
