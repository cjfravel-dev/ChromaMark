/**
 * Editable rendered editor for ChromaMark (`.cm`) and Markdown (`.md`) files.
 *
 * A `CustomTextEditorProvider`, which is the only way to edit from a rendered
 * view: the built-in Markdown preview is owned by the Markdown extension, so
 * scripts contributed into it have no way to write back. Here the webview is
 * ours, and every edit is applied to the underlying `TextDocument` through a
 * `WorkspaceEdit` — so dirty state, undo, and save keep working normally.
 *
 * Edits arrive as line-range replacements produced from `token.map`, never as a
 * reserialization of the whole document, so syntax the editor does not
 * understand is left byte-for-byte alone.
 */

import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { renderEditable } from './blocks.mjs';
import { resolveToggleAction, VIEW_TYPE } from './toggle.mjs';

export { VIEW_TYPE };

/**
 * Context key backing the title-bar icon swap.
 *
 * The built-in `activeCustomEditorId` is documented for exactly this, but it
 * does not match a custom editor of ours in practice: with the exit action
 * gated on it, the rendered editor showed no way out. A key we set ourselves is
 * both reliable and testable, which the built-in one is not.
 */
const IN_EDITOR_CONTEXT = 'chromamark.inRenderedEditor';

// Panels, not a single flag: switching between two rendered editors fires the
// deactivation of one and the activation of the other in no guaranteed order, so
// tracking which panels are active and deriving the key is the only way to avoid
// a stale `false` clearing the icon on the tab that is now in front.
const activePanels = new Map();

function setPanelActive(panel, active, uri) {
  if (active) activePanels.set(panel, uri);
  else activePanels.delete(panel);
  vscode.commands.executeCommand('setContext', IN_EDITOR_CONTEXT, activePanels.size > 0);
}

/**
 * The document shown by the active rendered editor. The exit command reads the
 * URI off the active tab, but a custom editor's tab input is not guaranteed to
 * carry a view type we recognize; this is what it falls back to.
 */
function activeRenderedUri() {
  let last;
  for (const uri of activePanels.values()) last = uri;
  return last;
}

// The nonce is what stops anything but our own bundle from executing in the
// webview, so it has to be unguessable rather than merely unique.
function nonce() {
  return randomBytes(16).toString('hex');
}

function pageHtml(webview, extensionUri, cspNonce) {
  const asset = (...parts) =>
    webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...parts)).toString();
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource}`,
    `script-src 'nonce-${cspNonce}'`,
    `img-src ${webview.cspSource} https: data:`,
    `font-src ${webview.cspSource}`,
  ].join('; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${asset('media', 'chromamark.css')}">
<link rel="stylesheet" href="${asset('media', 'editor.css')}">
<title>ChromaMark</title>
</head>
<body class="cm-editable">
<div id="cm-doc"></div>
<div id="cm-status" role="status" aria-live="polite"></div>
<script nonce="${cspNonce}" src="${asset('dist', 'editor.js')}"></script>
</body>
</html>`;
}

class EditableEditorProvider {
  constructor(context) {
    this.context = context;
  }

  async resolveCustomTextEditor(document, panel, _token) {
    const { webview } = panel;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
        vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
      ],
    };
    webview.html = pageHtml(webview, this.context.extensionUri, nonce());

    const post = () => {
      const source = document.getText();
      let html;
      try {
        html = renderEditable(source).html;
      } catch (error) {
        html = `<p>ChromaMark could not render this document: ${String(error && error.message)}</p>`;
      }
      webview.postMessage({ type: 'update', html, source });
    };

    // The document is the source of truth: external writes, undo, and edits made
    // in a source editor beside this one all flow back through here.
    const changeSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.toString() === document.uri.toString()) post();
    });

    setPanelActive(panel, panel.active !== false, document.uri);
    if (panel.onDidChangeViewState) {
      panel.onDidChangeViewState(() => setPanelActive(panel, panel.active === true, document.uri));
    }
    panel.onDidDispose(() => {
      changeSubscription.dispose();
      setPanelActive(panel, false);
    });

    webview.onDidReceiveMessage((message) => {
      if (!message) return;
      if (message.type === 'ready') return post();
      if (message.type === 'edit') return this.applyEdit(document, message);
      return undefined;
    });
  }

  /** Replaces the half-open line range `[start, end)` with the edited text. */
  async applyEdit(document, { start, end, text }) {
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) return;
    if (end > document.lineCount) return;

    const range = new vscode.Range(
      new vscode.Position(start, 0),
      end >= document.lineCount
        ? document.lineAt(document.lineCount - 1).range.end
        : new vscode.Position(end, 0),
    );
    // A block's range is half-open and excludes the blank line that separated it
    // from the next block, so the separator has to be written back with it.
    const replacement = end >= document.lineCount ? text : `${text}\n`;

    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, replacement);
    await vscode.workspace.applyEdit(edit);
  }
}

/** Registers the editor for the lifetime of the extension. */
export function registerEditableEditor(context) {
  return vscode.Disposable.from(
    vscode.window.registerCustomEditorProvider(
      VIEW_TYPE,
      new EditableEditorProvider(context),
      { webviewOptions: { retainContextWhenHidden: true }, supportsMultipleEditorsPerDocument: true },
    ),
    vscode.commands.registerCommand('chromamark.toggleRenderedEditing', () => toggleRenderedEditing()),
  );
}

/** The active tab, or undefined when no group has one. */
function activeTab() {
  const group = vscode.window.tabGroups.activeTabGroup;
  return (group && group.activeTab) || undefined;
}

function allTabs() {
  const tabs = [];
  for (const group of vscode.window.tabGroups.all) for (const tab of group.tabs) tabs.push(tab);
  return tabs;
}

/**
 * Closes the tabs a switch left behind.
 *
 * Switching surfaces means opening the new one and closing the old, because
 * `vscode.openWith` always adds a tab: without this, moving into the rendered
 * editor from a preview left three tabs open on the same file — the preview, the
 * source revealed to learn its URI, and the editor itself.
 *
 * Always called after the replacement is open, never before, so the document is
 * never momentarily closed — closing the last editor of a dirty file would
 * prompt to save.
 */
async function closeTabs(tabs) {
  const stale = tabs.filter(Boolean);
  if (!stale.length) return;
  try {
    await vscode.window.tabGroups.close(stale, true);
  } catch {
    // Closing is tidying, not the point of the command; a tab that has already
    // gone must not turn a successful switch into a visible failure.
  }
}

/**
 * Switches the active file between the rendered editor and the rendered preview,
 * replacing the surface it was invoked from.
 *
 * `superseded` carries the tabs the switch has already made redundant, which is
 * how the preview branch cleans up after itself: a preview tab does not name its
 * document, so the source has to be revealed to learn the URI, and that revealed
 * tab is then as stale as the preview it came from. It doubles as the retry
 * guard — a failed reveal must not loop.
 */
async function toggleRenderedEditing(superseded) {
  const editor = vscode.window.activeTextEditor;
  const activeUri = editor && editor.document ? editor.document.uri : undefined;
  const current = activeTab();
  const { action, uri } = resolveToggleAction(
    current && current.input,
    activeUri,
    activeRenderedUri(),
  );

  if (action === 'none') {
    if (!superseded) {
      vscode.window.showInformationMessage(
        'ChromaMark: open a .cm or .md file to edit it in the rendered view.',
      );
    }
    return;
  }
  if (action === 'showSource') {
    if (superseded) return;
    const before = new Set(allTabs());
    await vscode.commands.executeCommand('markdown.showSource');
    const revealed = allTabs().filter((tab) => !before.has(tab));
    return toggleRenderedEditing([current, ...revealed]);
  }
  if (action === 'toPreview') return showPreview(uri, current);

  await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE);
  await closeTabs(superseded || [current]);
}

/**
 * Leaves the rendered editor for the rendered preview.
 *
 * The preview cannot be opened for a document that has no editor, so the file is
 * reopened in the default (source) editor first and then reopened in place as
 * the preview.
 */
async function showPreview(uri, current) {
  await vscode.commands.executeCommand('vscode.openWith', uri, 'default');
  try {
    await vscode.commands.executeCommand('markdown.reopenAsPreview');
  } catch {
    // The open-mode handler may already have reopened it as a preview, leaving
    // no source editor for the command to act on. The source editor is a fine
    // place to land, so this is not worth reporting.
  }
  await closeTabs([current]);
}
