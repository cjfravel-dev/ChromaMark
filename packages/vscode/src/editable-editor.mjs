/**
 * Experimental editable editor for `.cm` files.
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
const SETTING = 'experimental.editableEditor';

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
    panel.onDidDispose(() => changeSubscription.dispose());

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

/**
 * Registers the editor while `chromamark.experimental.editableEditor` is on, and
 * follows the setting so toggling it does not need a window reload.
 */
export function registerEditableEditor(context) {
  let registration;

  const enabled = () =>
    vscode.workspace.getConfiguration('chromamark').get(SETTING) === true;

  const sync = () => {
    if (enabled() && !registration) {
      registration = vscode.window.registerCustomEditorProvider(
        VIEW_TYPE,
        new EditableEditorProvider(context),
        { webviewOptions: { retainContextWhenHidden: true }, supportsMultipleEditorsPerDocument: true },
      );
    } else if (!enabled() && registration) {
      registration.dispose();
      registration = undefined;
    }
  };

  sync();
  return vscode.Disposable.from(
    // Registrations come and go as the setting is toggled, so only the current
    // one is disposed here; pushing each to context.subscriptions would leave
    // every dead registration behind for the life of the session.
    { dispose: () => { if (registration) registration.dispose(); registration = undefined; } },
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(`chromamark.${SETTING}`)) sync();
    }),
    vscode.commands.registerCommand('chromamark.toggleRenderedEditing', () =>
      toggleRenderedEditing({ enabled, sync }),
    ),
  );
}

/** The `Uri` of the active tab and editor, whichever the active surface exposes. */
function activeTabInput() {
  const group = vscode.window.tabGroups.activeTabGroup;
  const tab = group && group.activeTab;
  return (tab && tab.input) || {};
}

/**
 * Switches the active `.cm` file between the normal editor and the editable
 * editor. Invoking it is a deliberate opt-in, so it turns the experimental
 * setting on rather than failing with an explanation the user cannot act on.
 */
async function toggleRenderedEditing({ enabled, sync }) {
  const editor = vscode.window.activeTextEditor;
  const activeUri = editor && editor.document ? editor.document.uri : undefined;
  const { action, uri } = resolveToggleAction(activeTabInput(), activeUri);

  if (action === 'none') {
    vscode.window.showInformationMessage('ChromaMark: open a .cm file to edit it in the rendered view.');
    return;
  }
  if (action === 'showSource') {
    await vscode.commands.executeCommand('markdown.showSource');
    return toggleRenderedEditing({ enabled, sync });
  }
  if (action === 'toSource') {
    await vscode.commands.executeCommand('vscode.openWith', uri, 'default');
    return;
  }

  if (!enabled()) {
    await vscode.workspace
      .getConfiguration('chromamark')
      .update(SETTING, true, vscode.ConfigurationTarget.Global);
    sync();
  }
  await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE);
}
