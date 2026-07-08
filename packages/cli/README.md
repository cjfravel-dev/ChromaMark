# @chromamark/cli

Compile [ChromaMark](https://github.com/cjfravel-dev/ChromaMark) (`.cm`) files
into **self-contained HTML** — the theme is inlined, so there's no CDN or build
step to deploy.

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
```

Options: `-o/--output`, `--stdout`, `--title <text>`, `--watch`, `-h/--help`,
`-v/--version`.

## Programmatic

```js
import { compile, render } from '@chromamark/cli';

const page = compile('::: success\nAll good [!pass]\n:::', { title: 'Report' });
// → complete <!DOCTYPE html> document with the theme inlined
const fragment = render('[!pass]'); // just the HTML fragment
```

## License

Modified MIT License with a SaaS source-availability provision — see LICENSE.md.
