/**
 * ChromaMark VS Code extension.
 *
 * - Contributes the ChromaMark renderer to the built-in Markdown preview via
 *   extendMarkdownIt, so `:::` blocks, pills, meters, fields and inline diff
 *   render live.
 * - Opens ChromaMark files (.cm) directly as the rendered preview by
 *   reopening the just-opened source editor as the Markdown preview in place.
 *   To edit, use the editor's "Reopen as Source" action — a document is only
 *   auto-converted once per session, so reopening as source is never undone.
 *
 * Bundled with esbuild (renderer + markdown-it inlined); `vscode` stays external.
 */

import * as vscode from 'vscode';
import chromamark from '@chromamark/renderer';

const CM_FILE = /\.cm$/i;

function isChromaMarkFile(doc) {
  return (
    !!doc &&
    doc.languageId === 'markdown' &&
    doc.uri.scheme === 'file' &&
    CM_FILE.test(doc.fileName || doc.uri.path || '')
  );
}

export function activate(context) {
  // Session-persistent so that reopening a document as source is not reverted.
  const converted = new Set();

  const openAsPreview = async (editor) => {
    const doc = editor && editor.document;
    if (!isChromaMarkFile(doc)) return;
    const key = doc.uri.toString();
    if (converted.has(key)) return;
    converted.add(key);
    try {
      await vscode.commands.executeCommand('markdown.reopenAsPreview');
    } catch {
      converted.delete(key);
    }
  };

  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(openAsPreview));
  openAsPreview(vscode.window.activeTextEditor);

  return {
    extendMarkdownIt(md) {
      return md.use(chromamark);
    },
  };
}

export function deactivate() {}
