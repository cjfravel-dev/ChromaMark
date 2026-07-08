# chromamark (Python)

Render and build [ChromaMark](https://github.com/cjfravel-dev/ChromaMark) from
Python — colored blocks, pills, collapsible sections, fields, meters, and inline
diff on top of Markdown (CommonMark + GFM). Produces the **same HTML** as the JS
renderer, so the same theme applies, and it displays inline in Jupyter.

Built on [markdown-it-py](https://github.com/executablebooks/markdown-it-py).

## Install

```bash
pip install chromamark
```

## Render

```python
from chromamark import render, create_renderer

html = render("::: success\nAll good [!ok pass]\n:::")

# or as a markdown-it-py plugin:
from markdown_it import MarkdownIt
from chromamark import chromamark_plugin
md = MarkdownIt("commonmark").use(chromamark_plugin)
```

## Build (fluent, for agent reports)

```python
from chromamark import ChromaDoc

doc = ChromaDoc()
doc.heading("Deploy report")
doc.success("Deploy succeeded", "3/3 replicas healthy")
doc.fields(Region="eastus", Status=doc.pill("ok", "healthy"))
doc.table(["Stage", "Result"], [["unit", doc.pill("pass", "247")]])
print(doc.to_cm())     # ChromaMark source
print(doc.to_html())   # rendered HTML
```

## Jupyter

```python
from chromamark import display_chromamark
display_chromamark("::: success\nRun complete [=success 100%]\n:::")
```

`ChromaDoc` also renders itself in notebooks via `_repr_html_`.

A runnable, pre-executed example notebook lives at
[`examples/chromamark_report.ipynb`](./examples/chromamark_report.ipynb) — it
builds a model-evaluation report (colored block, pills, meters, fields, a table,
and a collapsible) from computed results.

## Parity with the JavaScript renderer

`chromamark` produces byte-identical HTML to `@chromamark/renderer` for normal
content — verified by a differential harness over ~140,000 inputs (every
ChromaMark construct, GFM, linkify, and the full SPEC/demo documents all match
exactly). Three **exotic** edge cases differ, all involving unusual whitespace or
non-BMP characters; none affect typical agent-generated reports:

- **Non-ASCII whitespace at a block edge** (e.g. a leading U+3000 ideographic
  space): JS markdown-it preserves it (`asciiTrim`); markdown-it-py strips all
  Unicode whitespace. Upstream base-engine difference.
- **Six control/format code points inside ChromaMark constructs**
  (U+001C–U+001F, U+0085 NEL, U+FEFF BOM): counted as whitespace by one engine's
  regex/`strip` but not the other, which can flip pill/field parsing.
- **Astral-plane (emoji) domain labels** in bare links (e.g. `🎉.com`): auto-linked
  by JS linkify-it but not linkify-it-py. BMP and IDN letter hosts match.

## Credits

Inline change-tracking syntax is adopted from **[CriticMarkup](http://criticmarkup.com/)**
(© 2013 Gabe Weatherhead & Erik Hess, Apache-2.0); ChromaMark's parser is an original,
independent implementation. See the
[main README](https://github.com/cjfravel-dev/ChromaMark#prior-art--credits) for full credits.

## License

Modified MIT License with a SaaS source-availability provision — see LICENSE.md.
