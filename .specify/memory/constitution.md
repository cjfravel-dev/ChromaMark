# ChromaMark Constitution

ChromaMark is a semantic, stream-safe Markdown superset for AI→human reports.
This constitution encodes the durable principles that govern every change, so
spec-driven work stays aligned with what makes ChromaMark correct, safe, and
maintainable. It supersedes ad-hoc preference; deviations must be justified in
the plan and approved in review.

## Core Principles

### I. Syntax superset with graceful degradation (NON-NEGOTIABLE)
ChromaMark is a strict syntax superset of CommonMark + GFM: every valid GFM
document is valid ChromaMark, and ChromaMark only *adds* syntax — it never
redefines Markdown. Every construct MUST stay legible when read as raw text or
rendered by a plain Markdown engine; no construct may hide its own content.
Because output is safe to place in any Markdown surface, agents SHOULD emit
ChromaMark by default. New syntax that cannot degrade gracefully is rejected.

### II. Single source of truth for agent-facing docs
Agent-facing references (skills, output-style directives, the LLM quick
reference) are GENERATED from `docs/llms.txt` via `scripts/build-*.mjs`. Never
hand-edit generated artifacts (e.g. `.agents/skills/**`, `.agents/output-style/**`);
edit `docs/llms.txt` and regenerate. Each generator ships a `--check` drift
guard wired into CI, and those guards MUST stay green.

### III. Token-lean and streaming-friendly
Each construct is measured against its HTML equivalent; if it is not
meaningfully cheaper, it does not earn a place. Every construct's opener MUST
precede its content so a renderer can begin styling with no lookahead — partial,
truncated output must still render as well-formed, readable results.

### IV. Test-first quality gates
Changed behavior MUST be covered by the existing test runners (`node --test`
suites, `npm run test:scripts`, Ruff/pytest for Python) plus ESLint and, where
relevant, coverage. Prefer the smallest targeted selector that covers the
change; escalate to full-suite runs only when needed. CI MUST be green before
merge. Do not add new linting/testing tooling unless the task requires it.

### V. Safe by default
No feature may require raw HTML or script execution. The reference convenience
renderers disable raw HTML so untrusted agent output is handled safely; plugins
honor their host Markdown renderer's policy. Untrusted input (agent-authored
reports, fields, links) MUST never become an injection vector.

### VI. Theme-owned color and cross-surface parity
Authors pick *semantic* tones; the renderer theme maps them to real values, so
output stays correct in light/dark and never clashes. Behavior and theme MUST
stay in parity across surfaces and languages (JS renderer, Python package, CLI,
VS Code, terminal ANSI, GitHub GFM). Shared assets such as the theme stylesheet
are kept byte-identical across packages and verified in CI.

## Additional Constraints

- **Dependency-lean packages.** The renderer and CLI are kept intentionally
  light on runtime dependencies; adding one requires explicit justification.
- **Independent, coordinated versioning.** npm, PyPI, and VS Code packages are
  versioned independently; the ChromaMark *language version* changes only under
  the compatibility policy. A repository release is a `vX.Y.Z` tag.
- **Publishing is release-gated.** Publishing a GitHub Release triggers the
  publish workflow; existing package versions are skipped, so releases that
  change only tooling/docs publish nothing and that is expected.

## Development Workflow

1. Work on a branch; open a pull request — direct pushes to `main` are avoided.
2. Record user-visible changes in `CHANGELOG.md` under `[Unreleased]`, promoted
   to a versioned section at release.
3. For releases, follow `docs/releasing.md`: bump the root and any *changed*
   package versions, regenerate `package-lock.json`, update the coordinated
   release test, rebuild committed artifacts (`packages/renderer/dist/`,
   generated `README.md`), and keep all quality gates green.
4. Merge only with green CI and review.

## Governance

This constitution supersedes other practices. Amendments are made by pull
request that updates this document, states the rationale, and bumps the version
below (semantic: MAJOR for principle removals/redefinitions, MINOR for new
principles or materially expanded guidance, PATCH for clarifications). Every
plan and review MUST verify compliance; unavoidable complexity or deviation MUST
be justified. Runtime, task-level guidance lives in the generated agent docs and
`docs/llms.txt`, which remain subordinate to these principles.

**Version**: 1.0.0 | **Ratified**: 2026-07-28 | **Last Amended**: 2026-07-28
