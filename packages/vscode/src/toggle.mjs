/**
 * Decides what the "Toggle Rendered Editing" command should do, based on which
 * tab is active.
 *
 * This is separated from the command itself because the interesting part is the
 * dispatch, not the VS Code calls: the three surfaces a `.cm` file can be open
 * in — source editor, built-in Markdown preview, and the editable editor — each
 * expose themselves differently through the tab API, and the Markdown preview
 * notably does not expose the file it is previewing at all.
 */

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
 * Resolves the active tab to an action:
 *
 * - `toSource`   — leave the editable editor, back to the normal editor.
 * - `toEditable` — open `uri` in the editable editor.
 * - `showSource` — the Markdown preview does not expose its document, so the
 *   built-in "show source" command has to run first and the toggle retried.
 * - `none`       — nothing editable here.
 */
export function resolveToggleAction(tabInput, activeUri) {
  const input = tabInput || {};

  if (isEditableEditor(input)) return { action: 'toSource', uri: input.uri };
  if (isMarkdownPreview(input)) {
    // A preview tab carries no URI; fall back to a source editor if one is open
    // beside it, and otherwise ask VS Code to reveal the source first.
    return activeUri ? { action: 'toEditable', uri: activeUri } : { action: 'showSource' };
  }

  const uri = input.uri || activeUri;
  return uri ? { action: 'toEditable', uri } : { action: 'none' };
}
