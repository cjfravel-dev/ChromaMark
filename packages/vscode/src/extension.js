/**
 * ChromaMark VS Code extension.
 *
 * - Contributes the ChromaMark renderer to the built-in Markdown preview via
 *   extendMarkdownIt, so `:::` blocks, pills, meters, fields and inline diff
 *   render live.
 * - Applies a per-extension open mode when a supported file (`.cm`, `.md`)
 *   becomes active, driven by the `chromamark.<ext>.openMode` setting:
 *     - "preview": reopen the source editor as the rendered preview in place.
 *     - "sourceAndPreview": keep the source editor and open the preview beside it.
 *     - "source": leave the source editor as-is.
 *
 * A file is handled at most once per session; the "handled" set is keyed by URI
 * and cleared only when a file's last tab is closed, so reopening a previously
 * closed file applies its open mode again, while switching to source manually is
 * never undone (a tab for the URI still exists, so the flag is retained).
 *
 * Bundled with esbuild (renderer + markdown-it inlined); `vscode` stays external.
 */

import * as vscode from 'vscode';
import chromamark from '@chromamark/renderer';
import { extensionKey, isSupportedExtension, commandForMode, openModeChoices, extensionChoices } from './open-mode.mjs';

function isSupportedUri(uri) {
  return !!uri && uri.scheme === 'file' && isSupportedExtension(extensionKey(uri.path));
}

function isSupportedDoc(doc) {
  return !!doc && doc.languageId === 'markdown' && isSupportedUri(doc.uri);
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

// Command: pick a supported file type (defaulting to the active file's) and an
// open mode, then persist it to the user's `chromamark.<ext>.openMode` setting.
async function setOpenMode() {
  const active = vscode.window.activeTextEditor;
  const activeUri = active && active.document ? active.document.uri : undefined;
  const preferred = activeUri && activeUri.scheme === 'file' ? extensionKey(activeUri.path) : undefined;

  const extPick = await vscode.window.showQuickPick(extensionChoices(preferred), {
    title: 'ChromaMark: Set Open Mode',
    placeHolder: 'Which file type should this apply to?',
  });
  if (!extPick) return;

  const config = vscode.workspace.getConfiguration('chromamark');
  const current = config.get(`${extPick.ext}.openMode`);
  const modePick = await vscode.window.showQuickPick(openModeChoices(current), {
    title: `ChromaMark: Open mode for ${extPick.label} files`,
    placeHolder: 'How should these files open?',
  });
  if (!modePick) return;

  await config.update(`${extPick.ext}.openMode`, modePick.value, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(`ChromaMark: ${extPick.label} files will open as "${modePick.label}".`);
}

export function activate(context) {
  const handled = new Set();

  const applyOpenMode = async (editor) => {
    const doc = editor && editor.document;
    if (!isSupportedDoc(doc)) return;
    const key = doc.uri.toString();
    if (handled.has(key)) return;
    const ext = extensionKey(doc.uri.path);
    const mode = vscode.workspace.getConfiguration('chromamark').get(`${ext}.openMode`);
    const command = commandForMode(mode);
    handled.add(key);
    if (!command) return;
    try {
      await vscode.commands.executeCommand(command);
    } catch {
      handled.delete(key);
    }
  };

  // Forget a file once its last tab is gone, so a later reopen applies its mode again.
  const forgetClosed = (event) => {
    for (const tab of event.closed) {
      const uri = tabUri(tab);
      if (uri && isSupportedUri(uri) && !anyTabFor(uri.toString())) {
        handled.delete(uri.toString());
      }
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('chromamark.setOpenMode', setOpenMode),
    vscode.window.onDidChangeActiveTextEditor(applyOpenMode),
    vscode.window.tabGroups.onDidChangeTabs(forgetClosed),
  );
  applyOpenMode(vscode.window.activeTextEditor);

  return {
    extendMarkdownIt(md) {
      return md.use(chromamark);
    },
  };
}

export function deactivate() {}
