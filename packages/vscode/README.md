# ChromaMark for VS Code

Live preview and syntax highlighting for [ChromaMark](https://github.com/cjfravel-dev/ChromaMark)
— Markdown (CommonMark + GFM) plus **colored blocks**, **colored pills**,
**collapsible sections**, **fields**, **meters**, and inline **diff**.

## Features

- **Live preview.** Contributes the ChromaMark renderer to VS Code's built-in
  Markdown preview, so `:::` blocks, `[!pills]`, `[=meters]`, `::: fields`, and
  CriticMarkup render as you write. Open with **Markdown: Open Preview**
  (`Ctrl+Shift+V` / `Cmd+Shift+V`).
- **Configurable open mode.** Choose how ChromaMark (`.cm`) and Markdown (`.md`)
  files open — the rendered **preview only**, **source with preview** beside it,
  or **source only** — per extension via settings (see [Settings](#settings)). A
  file is handled once per session, so switching to source manually is never undone.
  Run **ChromaMark: Set Open Mode…** from the Command Palette (`F1`) to change it
  without leaving the editor.
- **Outline sidebar.** The preview shows a left-hand header tree — click to jump,
  with scroll-spy highlighting and a collapse toggle.
- **Syntax highlighting.** An injection grammar highlights ChromaMark constructs
  inside any Markdown document.
- **Live lint diagnostics.** `.cm` files show ChromaMark authoring mistakes in
  the Problems panel and editor as you type. Ordinary `.md` files are not linted.
- **`.cm` files.** This extension is treated as Markdown, so it gets
  full editing and preview support.

## Settings

Control how files open, per file extension:

| Setting | Default | Applies to |
| --- | --- | --- |
| `chromamark.cm.openMode` | `preview` | `.cm` files |
| `chromamark.md.openMode` | `sourceAndPreview` | `.md` files |

Each setting accepts:

- **`preview`** — open the rendered preview only (reopens the source editor as
  the preview in place).
- **`sourceAndPreview`** — open the source editor with the rendered preview
  beside it.
- **`source`** — open the source editor only (no automatic preview).

Prefer not to edit settings by hand? Run **ChromaMark: Set Open Mode…** from the
Command Palette (`F1`) to pick a file type and mode; it updates the matching
setting for you.

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
npm ci
npm run build --workspace @chromamark/renderer   # build the renderer
npm run build --workspace chromamark-vscode       # bundle the extension
```

Then press <kbd>F5</kbd> in VS Code to launch an Extension Development Host and
open any `.md` / `.cm` file with the preview.

## Build & install the VSIX

```bash
npm run package --workspace chromamark-vscode      # → chromamark-vscode-<version>.vsix
code --install-extension packages/vscode/*.vsix --force
```

The extension is bundled with esbuild (the renderer and markdown-it are inlined),
so the VSIX is self-contained. After installing, open a `.cm`/`.md` file and run
**Markdown: Open Preview** (`Ctrl+Shift+V` / `Cmd+Shift+V`).

## License

This software package is licensed under the [MIT License](./LICENSE.md). The
[ChromaMark specification](https://github.com/cjfravel-dev/ChromaMark/blob/main/LICENSE-SPEC.md)
is licensed separately under CC BY-SA 4.0.
