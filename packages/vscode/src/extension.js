/**
 * ChromaMark VS Code extension.
 *
 * - Contributes the ChromaMark renderer to the built-in Markdown preview via
 *   extendMarkdownIt, so `:::` blocks, pills, meters, fields and inline diff
 *   render live.
 * - Opens ChromaMark files (.cm) directly as the rendered preview by reopening
 *   the just-opened source editor as the Markdown preview in place. To edit, use
 *   the editor's "Reopen as Source" action.
 *
 * The "converted" set is keyed by URI and cleared only when a file's last tab is
 * closed, so: reopening a previously closed .cm previews again, while an explicit
 * "Reopen as Source" is never undone (a tab for the URI still exists, so the flag
 * is retained and the source editor is left alone).
 *
 * Bundled with esbuild (renderer + markdown-it inlined); `vscode` stays external.
 */

import * as vscode from 'vscode';
import chromamark from '@chromamark/renderer';

const CM_FILE = /\.cm$/i;

function isChromaMarkUri(uri) {
  return !!uri && uri.scheme === 'file' && CM_FILE.test(uri.path);
}

function isChromaMarkDoc(doc) {
  return !!doc && doc.languageId === 'markdown' && isChromaMarkUri(doc.uri);
}

function tabUri(tab) {
  const input = tab && tab.input;
  return input && input.uri ? input.uri : undefined;
}

function anyTabFor(key) {
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      const uri = tabUri(tab);
      if (uri && uri.toString() === key) return true;
    }
  }
  return false;
}

export function activate(context) {
  const converted = new Set();

  const openAsPreview = async (editor) => {
    const doc = editor && editor.document;
    if (!isChromaMarkDoc(doc)) return;
    const key = doc.uri.toString();
    if (converted.has(key)) return;
    converted.add(key);
    try {
      await vscode.commands.executeCommand('markdown.reopenAsPreview');
    } catch {
      converted.delete(key);
    }
  };

  // Forget a file once its last tab is gone, so a later reopen previews again.
  const forgetClosed = (event) => {
    for (const tab of event.closed) {
      const uri = tabUri(tab);
      if (uri && isChromaMarkUri(uri) && !anyTabFor(uri.toString())) {
        converted.delete(uri.toString());
      }
    }
  };

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(openAsPreview),
    vscode.window.tabGroups.onDidChangeTabs(forgetClosed),
  );
  openAsPreview(vscode.window.activeTextEditor);

  return {
    extendMarkdownIt(md) {
      return md.use(chromamark);
    },
  };
}

export function deactivate() {}
