# Changelog

Notable user-visible changes are recorded here. Package versions are independent
from the [ChromaMark language version](./docs/compatibility.md).

## [Unreleased]

### Added

- Added Contributor Covenant 2.1 with a private conduct-reporting address and
  transparent solo-maintainer enforcement limitations.

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
[0.4.1]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.4.1
[0.4.0]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.4.0
[0.3.1]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.3.1
[0.3.0]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.3.0
[0.2.2]: https://github.com/cjfravel-dev/ChromaMark/releases/tag/v0.2.2
