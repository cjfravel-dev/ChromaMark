# @chromamark/cli

Compile [ChromaMark](https://github.com/cjfravel-dev/ChromaMark) (`.cm`) files
into **self-contained HTML** — the theme is inlined, so there's no CDN or build
step to deploy — or render them straight to a **color terminal**.

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
```

Options: `-o/--output`, `--stdout`, `--title <text>`, `--watch`,
`--color <auto|always|never>`, `--no-color`, `-h/--help`, `-v/--version`.

The `render` command turns tones into terminal colors, pills into bracketed
icon chips (`[✓ PASS]`), blocks into a colored left bar, and meters into a
unicode bar. Color is automatic on a TTY and can be forced with `--color`; it
also honors the [`NO_COLOR`](https://no-color.org) convention.

## Programmatic

```js
import { compile, render, renderAnsi } from '@chromamark/cli';

const page = compile('::: success\nAll good [!pass]\n:::', { title: 'Report' });
// → complete <!DOCTYPE html> document with the theme inlined
const fragment = render('[!pass]'); // just the HTML fragment
const ansi = renderAnsi('[!pass]', { color: 'always' }); // terminal-styled text
```

## License

Modified MIT License with a SaaS source-availability provision — see LICENSE.md.
