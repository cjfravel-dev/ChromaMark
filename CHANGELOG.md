# Changelog

Notable user-visible changes are recorded here. Package versions are independent
from the [ChromaMark language version](./docs/compatibility.md).

## [Unreleased]

### Added

- **Collapsible table row groups** — ChromaMark language version `0.2`. A table
  row whose first cell begins with a run of `↳` (ASCII `>` is an accepted alias)
  becomes a child of the nearest preceding shallower row, which acts as the
  group's toggle; repeat the marker to nest. Markers are only significant in the
  first cell and are stripped from the rendered cell.
  - Backward compatible: those markers were previously literal text in a table
    cell, so every `0.1` document keeps its meaning, and a table containing no
    markers renders byte for byte as before.
  - Malformed depth degrades instead of failing — a row deeper than one level
    below its predecessor clamps, and a child row with no eligible parent becomes
    an ordinary row. New lint rules `CM006` (mixed `↳`/`>` markers) and `CM007`
    (clamped depth) flag both.
  - Degradation: the HTML keeps every row visible and the optional DOM enhancer
    adds real collapsing, `renderGitHub()` keeps every row and restores the `↳`
    prefix (GitHub cannot hide rows without scripting), the ANSI renderer indents
    child rows, and a plain Markdown engine shows the literal marker.
  - Implemented in the JavaScript renderer, the Python package, and the VS Code
    preview, with shared conformance cases covering all of it.

### Changed

- The `@chromamark/renderer` dev dependency on `@chromamark/conformance` pinned
  the published `0.1.0` instead of resolving the workspace copy, so the renderer
  suite silently tested the last published corpus rather than the one in this
  repository. The pin now matches the workspace version, so the local corpus is
  used.
- The slim browser bundle's documented gzip budget is now **10 KiB** (was 8 KiB)
  to make room for collapsible table row groups. The raw 32 KiB cap and the
  64 KiB budget for the full bundle are unchanged.

## [0.4.4] - 2026-07-28

### Fixed

- Agent adoption: the output-style directive and setup prompt no longer claim
  ChromaMark's constructs "degrade to clean, readable Markdown" everywhere. On
  surfaces that don't render ChromaMark (terminals/CLIs, plain-text chat, raw
  GitHub comments) the `:::` blocks, `[!pill]` badges, `[=meter]` bars, and
  change-tracking leak as literal syntax. The directive now instructs agents to
  use ChromaMark only where it renders and fall back to plain GFM otherwise.

### Added

- Agent adoption: the setup prompt now offers **global (user-level) install
  destinations** (e.g. `~/.copilot/copilot-instructions.md`, `~/.claude/CLAUDE.md`)
  in addition to per-project paths, so ChromaMark can be adopted once for all
  projects instead of per repository.

## [0.4.3] - 2026-07-27

### Added

- Agent adoption: a one-shot **setup prompt** at
  `https://cjfravel-dev.github.io/ChromaMark/agent-setup/prompt.md` that an agent
  fetches and runs itself to install the ChromaMark output-style directive into
  its host's always-on instructions (Copilot, Claude Code, Cursor, Windsurf,
  Codex/generic) and the authoring skill — so it emits ChromaMark by default.
- Agent adoption: an always-on **ChromaMark output-style directive**, generated
  from `docs/llms.txt` into each major host's native "always-applied
  instructions" format (`AGENTS.md`, `.github/copilot-instructions.md`,
  `CLAUDE.md`, `.cursor/rules/*.mdc`, `.windsurf/rules`) via
  `npm run build:output-style`. Unlike the on-demand authoring skill, this makes
  agents emit ChromaMark **by default**; being a strict GFM superset, it stays
  safe (degrades to plain Markdown) on any surface.
- Playground: a **Stream** button replays the current report token-by-token
  through the streaming renderer, demonstrating stable partial rendering.
- Playground: when a shareable URL grows too long to encode reliably, the share
  button now falls back to opening a prefilled GitHub issue with the source.
- An installable `chromamark-authoring` agent skill, generated from
  `docs/llms.txt`, discoverable via `npx skills add cjfravel-dev/ChromaMark`.

## [VS Code 0.2.4] - 2026-07-11

### Fixed

- VS Code previews now invalidate when a `.cm` or `.md` source is deleted before
  being recreated, matching the file lifecycle used by some coding agents.

## [VS Code 0.2.3] - 2026-07-11

### Fixed

- VS Code preview-only tabs now refresh when `.cm` or `.md` files change on
  disk, including atomic file replacements.

## [0.4.2] - 2026-07-10

### Added

- Added Contributor Covenant 2.1 with a private conduct-reporting address and
  transparent solo-maintainer enforcement limitations.

### Fixed

- Replaced polynomial linter regular expressions with linear scanners, escaped
  backslashes in GitHub-exported link/image titles, and limited default CI token
  permissions to read-only.

## [0.4.1] - 2026-07-10

### Changed

- Reframed the README around “Markdown for AI-generated reports,” leading with
  semantic state, streaming, graceful truncation, and HTML tradeoffs.
- Elevated the VS Code Marketplace extension as the primary shared evaluation
  surface for humans and agents reviewing generated reports.
- Added Open VSX discovery alongside the VS Code Marketplace and pinned browser
  examples to the released npm renderer instead of the mutable default branch.
- Updated the security policy to identify the current supported package lines.
- Added a rendered product preview plus structured bug, feature, and pull
  request templates for public contributors.
- Republished the conformance kit through npm trusted publishing so every npm
  package in the release carries provenance.

### Fixed

- Theme presets now set semantic report-body foreground colors, preserving
  contrast when dark presets are previewed in a light host and vice versa.
- Added the published `@chromamark/conformance` package badge to the README.
- Slim browser source loading now records synchronous and non-`Error` fetch
  failures instead of throwing while handling them.
- Updated the development bundler beyond the version affected by
  `GHSA-67mh-4wv8-2f99`.

## [0.4.0] - 2026-07-10

### Added

- Automated Open VSX publication of the same tested VSIX used for Microsoft
  Marketplace releases.
- Playground controls for every built-in theme, safe custom theme JSON, and
  realistic agent code-review, evaluation, deployment, and incident samples.
- Tokenless VS Code Marketplace publishing through GitHub OIDC, an Entra managed
  identity, and `vsce --azure-credential`.
- Safe theme preset/resolution/application APIs with GitHub light/dark, ocean,
  sunset, and monochrome palettes plus constrained semantic overrides.
- Versioned compressed playground share links with legacy base64 compatibility;
  the README demo links to its exact full ChromaMark source.
- Parser-free `browser-slim` ESM/global entries for consumers that supply
  MarkdownIt or another render function, with an 8 KiB gzip budget.
- Append-only incremental renderer sessions and browser stable-prefix/tail DOM
  patching, with exact full-render parity on finalization.
- Public `@chromamark/conformance` kit with versioned fixtures, JSON Schema,
  typed validation/runner APIs, and a language-neutral runner protocol.
- Python `lint()` parity and a lint-focused `chromamark lint` console command,
  backed by the same CM001–CM005 diagnostic corpus as JavaScript.
- VS Code quick fixes for CM001–CM005 diagnostics: unwrap backticked constructs,
  correct tone/block typos, reset invalid meters, and append closing fences.
- GitHub-native GFM export through renderer/CLI `renderGitHub` APIs and the
  `chromamark github` command, including Alerts, details, tables, tone-aware
  badges, meters, and CriticMarkup degradation.
- First-party dogfooding: Actions coverage reports are authored in ChromaMark,
  and `README.md` is generated from canonical `README.cm`.

### Fixed

- JavaScript and Python plugins now honor their host Markdown renderer's raw
  HTML policy consistently across container bodies, titles, summaries, and
  fields; preconfigured renderers continue to escape raw HTML by default.
- Documentation, compatibility guidance, grammar commentary, and examples now
  distinguish ChromaMark's strict syntax compatibility from the reference
  renderers' safe default HTML policy.
- The README now labels its GitHub-rendered demo as a transpiled approximation
  and links to the playground for the full ChromaMark experience.

## [0.3.1] - 2026-07-09

### Added

- Shared JavaScript/Python exact-HTML conformance corpus ([#34]).
- CI matrices for Node 18/24 and Python 3.9/3.12/3.14 ([#35]).
- Deterministic npm installs and generated-artifact drift checks ([#36]).
- Accessible progressbar semantics for rendered meters ([#37]).
- ESLint and Ruff static quality gates ([#39]).
- ChromaMark language version `0.1`, public version constants, and compatibility
  policy ([#40]).
- Bundled TypeScript declarations for renderer, browser, and CLI entry points.
- Live ChromaMark lint diagnostics for `.cm` files in VS Code.
- Dependency-free fenced-code highlighting hooks in JavaScript and Python.
- Standardized licensing: MIT for software and CC BY-SA 4.0 for the
  specification, with explicit CommonMark and GFM attribution.

### Fixed

- CLI and eval argument validation now rejects ignored positionals, missing
  values, unknown task IDs, invalid thresholds, and setup errors ([#38]).
- CLI watch mode registers its filesystem watcher before reporting the initial
  build, closing a race that could miss an immediate file change.

## [0.3.0] - 2026-07-09

### Added

- ANSI terminal rendering and `NO_COLOR` support.
- ChromaMark linter and CLI `render`/`lint` commands.
- Formal EBNF grammar and LLM conformance eval harness.

## [0.2.2] - 2026-07-08

### Fixed

- Fence-aware container closing and consistent default raw-HTML escaping.
- JavaScript/Python whitespace parity and browser dedent tab preservation.
- CLI option parsing, Python builder escaping, and VS Code CriticMarkup
  highlighting and packaging.

[#34]: https://github.com/cjfravel-dev/ChromaMark/pull/34
[#35]: https://github.com/cjfravel-dev/ChromaMark/pull/35
[#36]: https://github.com/cjfravel-dev/ChromaMark/pull/36
[#37]: https://github.com/cjfravel-dev/ChromaMark/pull/37
[#38]: https://github.com/cjfravel-dev/ChromaMark/pull/38
[#39]: https://github.com/cjfravel-dev/ChromaMark/pull/39
[#40]: https://github.com/cjfravel-dev/ChromaMark/pull/40
[0.4.4]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.4.4
[0.4.3]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.4.3
[0.4.2]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.4.2
[0.4.1]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.4.1
[0.4.0]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.4.0
[0.3.1]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.3.1
[0.3.0]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.3.0
[0.2.2]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.2.2
