---
name: chromamark-authoring
description: >-
  Author ChromaMark (.cm) — a stream-safe Markdown superset for AI→human reports
  that encodes semantic state (status, severity, pass/fail, progress, fields,
  and change tracking) as callouts, pills, colored text, and meters. Use when
  writing, emitting, or reviewing .cm reports or rich agent report output.
---

# ChromaMark authoring

ChromaMark is Markdown (CommonMark + GFM) plus a few semantic constructs for
agent→human reports. Emit it as plain text with a `.cm` extension. Ordinary
Markdown always works, so when unsure, fall back to plain Markdown.

## Workflow

1. Write the report as `.cm`, using the constructs below to encode *state*
   (status, severity, progress, fields) instead of describing it in prose.
2. Keep every ChromaMark construct **bare** — never inside backticks or code
   spans, or it renders as literal text.
3. Validate before shipping: `npx @chromamark/cli lint report.cm` (or
   `chromamark lint report.cm`) catches the common mistakes.

## Syntax reference

ChromaMark is Markdown (CommonMark + GFM) plus a handful of constructs for rich
agent→human reports. Emit it as plain text. Everything below is the ENTIRE extra
syntax beyond normal Markdown; if in doubt, plain Markdown always works.

## Colored blocks (callouts)

    ::: <tone> [title]
    body (Markdown, may nest)
    :::

- tones: `success` `info` `tip` `warning` `danger` `muted`
- aliases: `ok`/`pass`→success, `error`/`fail`→danger, `warn`→warning, `note`→info, `hint`→tip, `skip`→muted
- color-only block: `::: block color=#6f42c1 Title`
- NEST with MORE colons on the outer fence: `:::: … ::: … ::: … ::::`

## Collapsible section

    ::: details [open] [tone] Summary
    hidden body
    :::

## Key/value fields

    ::: fields
    Region: eastus
    Status: [!ok healthy]
    :::

## Inline: pills, colored text, meters

- pill/badge: `[!success PASS]` `[!fail 3 of 88]` `[!warn 12]` `[!info 87%]` `[!muted SKIP]`
  - no label ⇒ token name, uppercased: `[!pass]` → PASS
- colored text (tint, no badge): `[.danger critical]`
- meter/progress bar: `[=success 87%]` `[=info 3/10]`  (value is `NN%` or `A/B`)
- custom color: `[!color=#6f42c1 beta]` or bare hex `[!#6f42c1 beta]`

## Inline change tracking (CriticMarkup)

Use these to SHOW an edit, suggestion, or before→after — mark the change, don't
just describe it in prose:

- `{++added++}` insert · `{--removed--}` delete · `{~~old~>new~~}` replace
- `{==highlight==}` · `{>>comment<<}`

Emit change-tracking BARE, in the sentence — never inside backticks:
- ✅  Rename {~~expected~>actual~~} in the assertion.
- ❌  Rename `{~~expected~>actual~~}` in the assertion.  ← backticks = literal code

## Rules & gotchas

- Strict syntax superset: tables, lists, code fences, **bold**, etc. all work.
- ⚠️ NEVER put a ChromaMark construct inside backticks or a code span — this includes pills, meters, colored text, AND change-tracking. `` `[!pass]` `` and `` `{~~a~>b~~}` `` render as literal code. Emit them bare: `[!pass]`, `{~~a~>b~~}`. Backticks are only for real code/filenames.
- Pills work inside table cells and headings.
- Block titles and details summaries render inline too — pills, colored text, meters, and markdown all work there (raw HTML follows the renderer policy and is escaped by default).
- Prefer the 6 semantic tones (they adapt to light/dark) over `color=#hex`.
- Unknown/unsupported constructs degrade to readable literal text.
- File extension `.cm`; fenced-code info tag is `chromamark`.

## Example report

    ## Deploy — service-recon @ 25d7426

    :::: success Deploy succeeded in 3m12s
    ::: fields
    Region: eastus
    Replicas: 3/3 [!ok healthy]
    Coverage: [=success 87%]
    :::
    ::::

    | Stage | Result          |
    | ----- | --------------- |
    | unit  | [!pass 247]     |
    | integ | [!fail 3 of 88] |

    ::: details danger Integration failures (3)
    FAILED test_recon_merge_precedence
    :::

    Suggested fix: {~~expected~>actual~~} in the merge assertion.

    Overall: [!warn SHIP WITH CAUTION]
