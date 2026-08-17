/**
 * Webview half of the experimental editable editor.
 *
 * Bundled by `build.mjs` into `media/editor.js`. The source of truth stays the
 * TextDocument: this side never holds the document, it only reports edits as
 * `{ start, end, text }` line-range replacements and re-renders when the
 * extension sends new HTML back.
 */

import { blockToMarkdown, headingLevel } from '../inline-md.mjs';

const vscode = acquireVsCodeApi();

const root = document.getElementById('cm-doc');
const status = document.getElementById('cm-status');

let sourceLines = [];
let editing = null;
let pendingHtml = null;

function setStatus(message) {
  status.textContent = message || '';
  status.classList.toggle('cm-visible', !!message);
}

function blockOf(node) {
  return node && node.closest ? node.closest('[data-cm-block]') : null;
}

function lineRange(element) {
  return {
    start: Number(element.getAttribute('data-cm-start')),
    end: Number(element.getAttribute('data-cm-end')),
  };
}

function sourceFor(element) {
  const { start, end } = lineRange(element);
  return sourceLines.slice(start, end).join('\n');
}

function render(html) {
  if (html == null) return;
  pendingHtml = html;
  if (editing) return;
  const scroll = window.scrollY;
  root.innerHTML = html;
  window.scrollTo(0, scroll);
}

function commit(text) {
  if (!editing) return;
  const { element, original } = editing;
  const { start, end } = lineRange(element);
  editing = null;
  setStatus('');
  if (text == null || text === original) {
    render(pendingHtml);
    return;
  }
  vscode.postMessage({ type: 'edit', start, end, text });
}

function cancel() {
  if (!editing) return;
  editing = null;
  setStatus('');
  render(pendingHtml);
}

/** Rich editing: the rendered element itself becomes editable. */
function editRich(element) {
  const heading = headingLevel(element);
  editing = { element, mode: 'rich', heading, original: sourceFor(element) };
  element.setAttribute('contenteditable', 'true');
  element.classList.add('cm-editing');
  element.focus();
  setStatus('Editing — Ctrl+B bold, Ctrl+I italic, Enter saves, Esc cancels');
}

/** Source editing: the block is swapped for a textarea of its raw lines. */
function editSource(element) {
  const text = sourceFor(element);
  const area = document.createElement('textarea');
  area.className = 'cm-source-editor';
  area.value = text;
  element.replaceWith(area);
  editing = { element, mode: 'source', original: text, area };
  area.style.height = `${area.scrollHeight + 4}px`;
  area.focus();
  setStatus('Editing source — Ctrl+Enter saves, Esc cancels');
}

function commitRich() {
  const { element, heading } = editing;
  const text = blockToMarkdown(element, { heading });
  if (text == null) {
    // The DOM no longer maps cleanly onto source; keep the file untouched.
    editing = null;
    setStatus('That edit could not be written back as ChromaMark — reverted.');
    render(pendingHtml);
    return;
  }
  commit(text);
}

function commitEditing() {
  if (!editing) return;
  if (editing.mode === 'rich') commitRich();
  else commit(editing.area.value);
}

function beginEdit(element) {
  if (editing) return;
  if (element.getAttribute('data-cm-mode') === 'rich') editRich(element);
  else editSource(element);
}

document.addEventListener('click', (event) => {
  if (editing) return;
  if (event.target.closest && event.target.closest('a')) return;
  const element = blockOf(event.target);
  if (element) beginEdit(element);
});

document.addEventListener('keydown', (event) => {
  if (!editing) return;
  const rich = editing.mode === 'rich';

  if (event.key === 'Escape') {
    event.preventDefault();
    cancel();
    return;
  }
  if (event.key === 'Enter' && (rich ? !event.shiftKey : event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    commitEditing();
    return;
  }
  if (rich && (event.ctrlKey || event.metaKey) && !event.altKey) {
    const key = event.key.toLowerCase();
    if (key === 'b' || key === 'i') {
      event.preventDefault();
      document.execCommand(key === 'b' ? 'bold' : 'italic');
    }
  }
});

document.addEventListener('focusout', (event) => {
  if (!editing) return;
  const target = editing.mode === 'rich' ? editing.element : editing.area;
  if (event.target === target) commitEditing();
});

window.addEventListener('message', (event) => {
  const message = event.data;
  if (!message || message.type !== 'update') return;
  sourceLines = String(message.source).split('\n');
  render(message.html);
});

// Browsers style bold/italic with CSS spans unless told to emit real elements,
// and a styled span is exactly what the serializer refuses to write back.
document.execCommand('styleWithCSS', false, false);
vscode.postMessage({ type: 'ready' });
