/**
 * Decides what the "Toggle Rendered Editing" command should do, based on which
 * tab is active.
 *
 * This is separated from the command itself because the interesting part is the
 * dispatch, not the VS Code calls: the three surfaces a document can be open in
 * — source editor, built-in Markdown preview, and the rendered editor — each
 * expose themselves differently through the tab API, and the Markdown preview
 * notably does not expose the file it is previewing at all.
 *
 * One command rather than two, so a single pencil sits in the title bar and
 * toggles: two commands would mean two `when` clauses, and the one covering the
 * rendered editor is the one that cannot be relied on to match.
 */

import { extensionKey, isSupportedExtension } from './open-mode.mjs';

export const VIEW_TYPE = 'chromamark.editableEditor';

/**
 * VS Code prefixes webview view types on tab inputs, so the Markdown preview
 * arrives as `mainThreadWebview-markdown.preview`.
 */
function isMarkdownPreview(input) {
  return typeof input.viewType === 'string' && input.viewType.includes('markdown.preview');
}

function isEditableEditor(input) {
  return typeof input.viewType === 'string' && input.viewType.endsWith(VIEW_TYPE);
}

/**
 * Whether a URI is one the rendered editor handles — `.cm` and `.md` alike, since
 * both are the same language rendered by the same renderer.
 *
 * The menu `when` clause already filters by extension, but the preview branch
 * below borrows the URI from whatever text editor happens to be active, which is
 * not necessarily the document being previewed, or even Markdown.
 */
function isEditableUri(uri) {
  return !!uri && isSupportedExtension(extensionKey(uri.path || uri.fsPath));
}

/**
 * Resolves the active tab to an action:
 *
 * - `toEditable` — open `uri` in the rendered editor.
 * - `toPreview`  — leave the rendered editor for the rendered preview.
 * - `showSource` — the Markdown preview does not expose its document, so the
 *   built-in "show source" command has to run first and the toggle retried.
 * - `none`       — nothing editable here.
 *
 * `renderedUri` is the document of the rendered editor that currently has focus,
 * if any. It is what makes the toggle reliable: a custom editor's tab input does
 * not always identify itself, and no built-in context key can be counted on to,
 * so which direction to go is decided from the extension's own record of which
 * panel is active rather than from anything VS Code reports about the tab.
 */
export function resolveToggleAction(tabInput, activeUri, renderedUri) {
  const input = tabInput || {};

  if (isEditableEditor(input) && input.uri) return { action: 'toPreview', uri: input.uri };
  if (renderedUri) return { action: 'toPreview', uri: renderedUri };

  if (isMarkdownPreview(input)) {
    // A preview tab carries no URI; fall back to a source editor if one is open
    // beside it, and otherwise ask VS Code to reveal the source first.
    return isEditableUri(activeUri)
      ? { action: 'toEditable', uri: activeUri }
      : { action: 'showSource' };
  }

  const uri = input.uri || activeUri;
  return isEditableUri(uri) ? { action: 'toEditable', uri } : { action: 'none' };
}
