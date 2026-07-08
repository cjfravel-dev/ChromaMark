# ChromaMark for VS Code

Live preview and syntax highlighting for [ChromaMark](https://github.com/cjfravel-dev/ChromaMark)
— Markdown (CommonMark + GFM) plus **colored blocks**, **colored pills**,
**collapsible sections**, **fields**, **meters**, and inline **diff**.

## Features

- **Live preview.** Contributes the ChromaMark renderer to VS Code's built-in
  Markdown preview, so `:::` blocks, `[!pills]`, `[=meters]`, `::: fields`, and
  CriticMarkup render as you write. Open with **Markdown: Open Preview**
  (`Ctrl+Shift+V` / `Cmd+Shift+V`).
- **Auto-preview.** Opens a preview to the side automatically when you open a
  ChromaMark file. Configurable via `chromamark.autoPreview` (see Settings).
- **Syntax highlighting.** An injection grammar highlights ChromaMark constructs
  inside any Markdown document.
- **`.cm` / `.cmd` files.** These extensions are treated as Markdown, so they get
  full editing and preview support.

## Example

```chromamark
::: success Deploy succeeded
Region `eastus`, 3/3 replicas [!ok healthy].
:::

Build [!pass] · lint [!warn 12] · coverage [=success 87%]

::: details danger Integration failures (3)
See the trace attached to the run.
:::
```

## How it works

The extension imports [`@chromamark/renderer`](../renderer) and applies it to the
preview's `markdown-it` instance via the `extendMarkdownIt` contribution point.
Preview styling is supplied by `media/chromamark.css`, themed to follow the
active editor color theme.

## Development

From the repository root:

```bash
npm install
npm run build --workspace @chromamark/renderer   # build the renderer
npm run build --workspace chromamark-vscode       # bundle the extension
```

Then press <kbd>F5</kbd> in VS Code to launch an Extension Development Host and
open any `.md` / `.cm` file with the preview.

## Settings

| Setting                  | Default | Description                                                            |
| ------------------------ | ------- | ---------------------------------------------------------------------- |
| `chromamark.autoPreview` | `cm`    | Auto-open a preview to the side: `off`, `cm` (`.cm`/`.cmd` files), `all` (any Markdown). |

## Build & install the VSIX

```bash
npm run package --workspace chromamark-vscode      # → chromamark-vscode-0.1.0.vsix
code --install-extension packages/vscode/chromamark-vscode-0.1.0.vsix --force
```

The extension is bundled with esbuild (the renderer and markdown-it are inlined),
so the VSIX is self-contained. After installing, open a `.cm`/`.md` file and run
**Markdown: Open Preview** (`Ctrl+Shift+V` / `Cmd+Shift+V`).

## License

MIT

