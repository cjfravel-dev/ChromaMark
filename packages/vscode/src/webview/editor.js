/**
 * Webview half of the experimental editable editor.
 *
 * Bundled by `build.mjs` into `media/editor.js`. The source of truth stays the
 * TextDocument: this side never holds the document, it only reports edits as
 * `{ start, end, text }` line-range replacements and re-renders when the
 * extension sends new HTML back.
 */

import { blockToMarkdown, headingLevel } from '../inline-md.mjs';
import { shiftTarget, findTarget, targetOf } from '../handoff.mjs';

const vscode = acquireVsCodeApi();

const root = document.getElementById('cm-doc');
const status = document.getElementById('cm-status');

let sourceLines = [];
let editing = null;
let pendingHtml = null;
// The block to open once an in-flight edit has round-tripped, and whether we are
// still waiting for that round trip.
let handoff = null;
let awaitingUpdate = false;
let inFlightEdit = null;

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

// The HTML assigned here is never author-controlled markup: it comes from the
// extension host, which renders it with markdown-it configured `html: false`, so
// raw HTML and `javascript:` links in a `.cm` file arrive escaped as text. The
// webview also runs under a `default-src 'none'` CSP whose only `script-src` is
// a per-load nonce, so even markup that reached the DOM could not execute. Both
// properties are pinned by tests in `test/editable-editor.test.mjs`.
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
    openHandoff();
    return;
  }
  const edit = { start, end, lineCount: text.split('\n').length };
  handoff = shiftTarget(handoff, edit);
  inFlightEdit = edit;
  awaitingUpdate = true;
  vscode.postMessage({ type: 'edit', start, end, text });
}

function cancel() {
  if (!editing) return;
  editing = null;
  setStatus('');
  render(pendingHtml);
  openHandoff();
}

/** Opens the block the reader asked for while the previous edit was committing. */
function openHandoff() {
  const target = handoff;
  handoff = null;
  if (!target || editing) return;
  const element = findTarget(root, target);
  if (element) beginEdit(element);
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
    openHandoff();
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

/** Whether a node is inside the surface currently being edited. */
function insideEditor(node) {
  if (!editing) return false;
  const surface = editing.mode === 'rich' ? editing.element : editing.area;
  return surface === node || surface.contains(node);
}

// Committing on blur alone loses the click that caused it: the document changes,
// the view re-renders, and the block the reader was reaching for is a different
// node by the time the click arrives. Pressing down outside the editor is the
// first moment we know a handoff is coming, so the intent is recorded here,
// before anything commits.
document.addEventListener('mousedown', (event) => {
  if (!editing || insideEditor(event.target)) return;
  // A single click outside only puts the current edit away — moving on to
  // another block is still a deliberate double click. `detail` is 2 on the
  // second press of a double click, the last moment before the commit
  // re-renders the block being reached for.
  const element = event.detail >= 2 ? blockOf(event.target) : null;
  handoff = element && element !== editing.element ? targetOf(element) : null;
  commitEditing();
}, true);

// Editing always takes a double click. A single click is how you select text,
// follow a link, or fold a details section, and making some blocks open on the
// first click and others on the second is worse than asking for two everywhere.
document.addEventListener('dblclick', (event) => {
  const target = event.target;
  if (target.closest && target.closest('a')) return;
  // A details summary is a control, not text: clicking it should still fold the
  // section away. Its body remains the way in to editing.
  if (target.closest && target.closest('summary')) return;

  const element = blockOf(target);
  if (!element) return;
  if (editing) {
    // Double-clicking inside the open editor is a word selection, not a request
    // to reopen it.
    if (insideEditor(target)) return;
    handoff = targetOf(element);
    commitEditing();
    return;
  }
  // The mousedown handler may already have committed a previous edit, leaving
  // this node detached and its replacement not yet rendered. It records the
  // handoff itself, already adjusted, so an existing one is never overwritten.
  if (awaitingUpdate) {
    if (!handoff) handoff = shiftTarget(targetOf(element), inFlightEdit);
    return;
  }
  // A commit that changed nothing re-renders straight away, so the node under
  // the cursor may already have been replaced by an identical one.
  const live = root.contains(element) ? element : findTarget(root, targetOf(element));
  if (live) beginEdit(live);
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

// Losing focus to something outside the webview (another editor, the terminal)
// still saves; clicks inside are already handled on mousedown.
window.addEventListener('blur', () => {
  if (editing) commitEditing();
});

window.addEventListener('message', (event) => {
  const message = event.data;
  if (!message || message.type !== 'update') return;
  sourceLines = String(message.source).split('\n');
  awaitingUpdate = false;
  inFlightEdit = null;
  render(message.html);
  openHandoff();
});

// Browsers style bold/italic with CSS spans unless told to emit real elements,
// and a styled span is exactly what the serializer refuses to write back.
document.execCommand('styleWithCSS', false, false);
vscode.postMessage({ type: 'ready' });
