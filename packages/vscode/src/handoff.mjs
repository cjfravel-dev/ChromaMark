/**
 * Keeps track of which block the reader asked for next while an edit is still
 * in flight.
 *
 * Committing an edit is a round trip: the webview posts a line-range
 * replacement, the extension applies it to the TextDocument, and the document
 * change comes back as fresh HTML. Anything the reader clicked in between is
 * pointing at a DOM that no longer exists — which is why clicking straight from
 * one block to another used to be swallowed by the re-render.
 *
 * The block is therefore remembered by source position rather than by node, and
 * the position is shifted by however many lines the committed edit added or
 * removed, so it still resolves after the document changes underneath it.
 */

/**
 * Adjusts a remembered block position for an edit that replaced the half-open
 * line range `[start, end)` with `lineCount` lines.
 */
export function shiftTarget(target, edit) {
  if (!target) return null;
  if (!edit) return { ...target };

  const delta = edit.lineCount - (edit.end - edit.start);
  // Only blocks below the edit move; a block above it keeps its position, and a
  // block overlapping it is the block just edited, which is not a handoff.
  const start = target.start >= edit.end ? target.start + delta : target.start;
  return { ...target, start };
}

/**
 * Finds the element for a remembered block, preferring its source position over
 * its ordinal: an edit can add or remove blocks, which renumbers every block
 * after it, but a shifted start line still identifies the same source.
 */
export function findTarget(root, target) {
  if (!root || !target) return null;
  return (
    root.querySelector(`[data-cm-start="${target.start}"]`) ||
    root.querySelector(`[data-cm-block="${target.index}"]`)
  );
}

/** The remembered position of a block element, live or already detached. */
export function targetOf(element) {
  if (!element) return null;
  return {
    start: Number(element.getAttribute('data-cm-start')),
    index: Number(element.getAttribute('data-cm-block')),
  };
}
