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
import chromamark, { lint } from '@chromamark/renderer';
import { quickFixes } from './code-actions.mjs';
import { extensionKey, isSupportedExtension, commandForMode, openModeChoices, extensionChoices } from './open-mode.mjs';

function isSupportedUri(uri) {
  return !!uri && uri.scheme === 'file' && isSupportedExtension(extensionKey(uri.path));
}

function isSupportedDoc(doc) {
  return !!doc && doc.languageId === 'markdown' && isSupportedUri(doc.uri);
}

function isChromaMarkDoc(doc) {
  return !!doc && doc.languageId === 'markdown' && !!doc.uri && extensionKey(doc.uri.path) === 'cm';
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
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('chromamark');
  const refreshPreviews = () => vscode.commands.executeCommand('markdown.preview.refresh');
  const watchSourceChanges = (watcher) => {
    watcher.onDidChange(refreshPreviews);
    watcher.onDidCreate(refreshPreviews);
    context.subscriptions.push(watcher);
  };

  const sourceWatcher = vscode.workspace.createFileSystemWatcher('**/*.{cm,md}');
  watchSourceChanges(sourceWatcher);
  const externalSourceWatchers = new Map();

  const watchExternalSource = (doc) => {
    if (vscode.workspace.getWorkspaceFolder(doc.uri)) return;
    const directory = vscode.Uri.joinPath(doc.uri, '..');
    const key = directory.toString();
    if (externalSourceWatchers.has(key)) return;
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(directory, '*.{cm,md}'),
    );
    externalSourceWatchers.set(key, watcher);
    watchSourceChanges(watcher);
  };

  const updateDiagnostics = (doc) => {
    if (!isChromaMarkDoc(doc)) return;
    const diagnostics = lint(doc.getText()).map((problem) => {
      const start = new vscode.Position(problem.line - 1, problem.column - 1);
      const end = new vscode.Position(problem.line - 1, problem.column);
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(start, end),
        problem.message,
        vscode.DiagnosticSeverity.Warning,
      );
      diagnostic.code = problem.rule;
      diagnostic.source = 'ChromaMark';
      return diagnostic;
    });
    diagnosticCollection.set(doc.uri, diagnostics);
  };

  const codeActionProvider = {
    provideCodeActions(doc, _range, actionContext) {
      if (!isChromaMarkDoc(doc)) return [];
      const source = doc.getText();
      return actionContext.diagnostics
        .filter((diagnostic) => diagnostic.source === 'ChromaMark')
        .flatMap((diagnostic) => {
          const code = typeof diagnostic.code === 'object' ? diagnostic.code.value : diagnostic.code;
          return quickFixes(source, {
            code,
            line: diagnostic.range.start.line + 1,
            column: diagnostic.range.start.character + 1,
          }).map((fix) => {
            const action = new vscode.CodeAction(fix.title, vscode.CodeActionKind.QuickFix);
            action.diagnostics = [diagnostic];
            action.isPreferred = fix.preferred;
            action.edit = new vscode.WorkspaceEdit();
            action.edit.replace(
              doc.uri,
              new vscode.Range(
                new vscode.Position(fix.start.line, fix.start.character),
                new vscode.Position(fix.end.line, fix.end.character),
              ),
              fix.text,
            );
            return action;
          });
        });
    },
  };

  const applyOpenMode = async (editor) => {
    const doc = editor && editor.document;
    if (!isSupportedDoc(doc)) return;
    watchExternalSource(doc);
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
    diagnosticCollection,
    vscode.languages.registerCodeActionsProvider(
      { language: 'markdown', pattern: '**/*.cm' },
      codeActionProvider,
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] },
    ),
    vscode.commands.registerCommand('chromamark.setOpenMode', setOpenMode),
    vscode.window.onDidChangeActiveTextEditor(applyOpenMode),
    vscode.window.tabGroups.onDidChangeTabs(forgetClosed),
    vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
    vscode.workspace.onDidChangeTextDocument((event) => updateDiagnostics(event.document)),
    vscode.workspace.onDidCloseTextDocument((doc) => diagnosticCollection.delete(doc.uri)),
  );
  for (const doc of vscode.workspace.textDocuments) updateDiagnostics(doc);
  applyOpenMode(vscode.window.activeTextEditor);

  return {
    extendMarkdownIt(md) {
      return md.use(chromamark);
    },
  };
}

export function deactivate() {}
