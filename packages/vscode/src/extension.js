/**
 * ChromaMark VS Code extension.
 *
 * - Contributes the ChromaMark renderer to the built-in Markdown preview via
 *   extendMarkdownIt, so `:::` blocks, pills, meters, fields and inline diff
 *   render live.
 * - Optionally opens a preview to the side automatically when a ChromaMark file
 *   is opened, controlled by the `chromamark.autoPreview` setting.
 *
 * Bundled with esbuild (renderer + markdown-it inlined); `vscode` stays external.
 */

import * as vscode from 'vscode';
import chromamark from '@chromamark/renderer';

const CM_FILE = /\.(cm|cmd)$/i;

/** Decide whether a document should trigger an automatic preview. */
function shouldAutoPreview(doc) {
  if (!doc || doc.languageId !== 'markdown' || doc.uri.scheme !== 'file') return false;
  const mode = vscode.workspace.getConfiguration('chromamark').get('autoPreview', 'cm');
  if (mode === 'all') return true;
  if (mode === 'cm') return CM_FILE.test(doc.fileName || doc.uri.path || '');
  return false; // 'off'
}

export function activate(context) {
  // Track documents we've already auto-previewed so switching back to an editor
  // doesn't reopen its preview.
  const previewed = new Set();

  const maybePreview = async (editor) => {
    const doc = editor && editor.document;
    if (!shouldAutoPreview(doc)) return;
    const key = doc.uri.toString();
    if (previewed.has(key)) return;
    previewed.add(key);
    const column = editor.viewColumn;
    try {
      await vscode.commands.executeCommand('markdown.showPreviewToSide', doc.uri);
      // Return focus to the source editor so typing continues uninterrupted.
      await vscode.window.showTextDocument(doc, { viewColumn: column, preserveFocus: false });
    } catch {
      previewed.delete(key);
    }
  };

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => maybePreview(editor)),
    vscode.workspace.onDidCloseTextDocument((doc) => previewed.delete(doc.uri.toString())),
  );

  // Handle the editor that is already active when the extension activates.
  maybePreview(vscode.window.activeTextEditor);

  return {
    extendMarkdownIt(md) {
      return md.use(chromamark);
    },
  };
}

export function deactivate() {}
