# @chromamark/cli

Compile [ChromaMark](https://github.com/cjfravel-dev/ChromaMark) (`.cm`) files
into **self-contained HTML** — the theme is inlined, so there's no CDN or build
step to deploy — transpile them to **GitHub-native GFM**, render them straight
to a **color terminal**, or **lint** them in CI.

## Install

```bash
npm install -g @chromamark/cli
# or run without installing:
npx @chromamark/cli build report.cm
```

## Usage

```bash
chromamark build report.cm                 # → report.html (self-contained)
chromamark build report.cm -o out.html     # explicit output
chromamark build docs/ -o site/            # every .cm in a tree → site/*.html
chromamark report.cm --stdout > out.html   # write to stdout
cat report.cm | chromamark -               # read from stdin
chromamark build report.cm --watch         # rebuild on change

chromamark render report.cm                # render to the terminal (ANSI)
cat report.cm | chromamark render          # render piped stdin
chromamark render report.cm --no-color     # plain, icon-annotated text

chromamark github report.cm                # GitHub-native GFM on stdout
chromamark github report.cm -o report.md   # write GitHub-native GFM
cat report.cm | chromamark github          # render piped stdin

chromamark lint report.cm                  # check for common mistakes (CI)
chromamark lint report.cm --disable CM001  # suppress a rule
```

Options: `-o/--output`, `--stdout`, `--title <text>`, `--watch`,
`--color <auto|always|never>`, `--no-color`, `--disable <rules>`, `-h/--help`,
`-v/--version`.

Commands accept one input source. Extra positional arguments, including a second
`-` stdin marker, are rejected instead of being silently ignored.

The `render` command turns tones into terminal colors, pills into bracketed
icon chips (`[✓ PASS]`), blocks into a colored left bar, and meters into a
unicode bar. Color is automatic on a TTY and can be forced with `--color`; it
also honors the [`NO_COLOR`](https://no-color.org) convention.

The `github` command maps callouts to GitHub Alerts, details and tables to native
GitHub structures, and pills to tone-aware `<kbd>` badges. See the complete
[mapping contract](../../docs/github-export.md).

The `lint` command flags mistakes that otherwise degrade silently — a construct
wrapped in backticks (`CM001`), an unknown tone (`CM002`), an unknown block kind
(`CM003`), a bad meter value (`CM004`), or an unclosed container (`CM005`) — and
exits non-zero when any are found. Suppress rules with `--disable CM001,CM003`.

## Programmatic

```js
import { compile, render, renderAnsi, renderGitHub, lint } from '@chromamark/cli';

const page = compile('::: success\nAll good [!pass]\n:::', { title: 'Report' });
// → complete <!DOCTYPE html> document with the theme inlined
const fragment = render('[!pass]'); // just the HTML fragment
const ansi = renderAnsi('[!pass]', { color: 'always' }); // terminal-styled text
const github = renderGitHub('[!pass]'); // ✅ <kbd>PASS</kbd>
const problems = lint('Use `[!pass]` here'); // [{ line, column, rule, ... }]
```

TypeScript declarations ship with the package.

## License

This software package is licensed under the MIT License; see LICENSE.md. The
[ChromaMark specification](https://github.com/cjfravel-dev/ChromaMark/blob/main/LICENSE-SPEC.md)
is licensed separately under CC BY-SA 4.0.
