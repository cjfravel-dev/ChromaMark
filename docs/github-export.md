# GitHub-native export

`renderGitHub()` translates ChromaMark into GitHub Flavored Markdown for pull
requests, issues, discussions, READMEs, and Actions job summaries. The output
uses GitHub-native structures and remains readable on other Markdown engines.

## Mapping

| ChromaMark | GitHub-native output |
| --- | --- |
| success or tip callout | `TIP` Alert |
| info or muted callout | `NOTE` Alert |
| warning callout | `WARNING` Alert |
| danger callout | `CAUTION` Alert |
| custom-color callout | `NOTE` Alert |
| details | `<details>` with `<summary>`; `open` is preserved |
| fields | `Field` / `Value` GFM table |
| pill | tone icon plus `<kbd>` badge |
| colored text | plain inline text |
| meter | ten-cell Unicode progress bar plus authored value |
| CriticMarkup insertion | `<ins>` |
| CriticMarkup deletion | GFM strikethrough |
| CriticMarkup substitution | stricken old text plus `<ins>` new text |
| CriticMarkup highlight | bold text |
| CriticMarkup comment | italic parenthetical text |

The tone icons used by pills and details are:

| Tone | Icon |
| --- | --- |
| success | ✅ |
| danger | ❌ |
| warning | ⚠️ |
| info | ℹ️ |
| tip | 💡 |
| muted | ⏸️ |
| custom color | 🔹 |

CommonMark and GFM headings, paragraphs, emphasis, links, lists, tables, code
fences, blockquotes, and thematic breaks remain native Markdown structures.

## JavaScript

```js
import { renderGitHub } from '@chromamark/renderer';

const markdown = renderGitHub('::: success\nReady [!pass]\n:::');
```

Raw HTML is escaped by default. Repository-owned source that intentionally uses
trusted HTML may opt in:

```js
const markdown = renderGitHub(source, { allowHtml: true });
```

GitHub sanitizes submitted Markdown, but `allowHtml` should still be reserved
for trusted source because the generated output may be consumed elsewhere.

## CLI

```bash
chromamark github report.cm                 # GFM on stdout
chromamark github report.cm -o report.md    # write a file
cat report.cm | chromamark github           # read stdin
```

## Repository dogfooding

The root `README.cm` is canonical; `npm run build:readme` generates `README.md`
through `renderGitHub()`, and CI rejects drift. The coverage Action also authors
its report in ChromaMark before transpiling it for the job summary and sticky PR
comment.
