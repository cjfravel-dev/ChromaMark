/**
 * Scoring for the ChromaMark LLM-conformance eval. A model's answer "passes" a
 * task when it is (1) syntactically valid — no lint diagnostics — and (2) uses
 * every construct the task asked for, verified by rendering and checking for the
 * corresponding output. Both checks reuse the real renderer and linter, so the
 * eval measures the same behavior end users get.
 */

import { render, lint } from '@chromamark/renderer';

/** Rendered-output signatures for each construct kind. */
const DETECT = {
  pill: /class="cm-pill/,
  text: /class="cm-text/,
  meter: /class="cm-meter/,
  block: /class="cm-block/,
  details: /class="cm-details/,
  fields: /class="cm-fields/,
  critic: /class="crit-/,
  table: /<table/,
  heading: /<h[1-6]/,
};

/** Unwrap a whole answer that a model fenced in ```chromamark … ``` (or ```). */
export function extractChromaMark(text) {
  const s = String(text ?? '').trim();
  const fence = /^```[^\n]*\n([\s\S]*?)\n```$/.exec(s);
  return fence ? fence[1].trim() : s;
}

/** The construct kinds that actually render in `cm`. */
export function usedConstructs(cm) {
  const html = render(cm);
  return Object.keys(DETECT).filter((k) => DETECT[k].test(html));
}

/**
 * Score one answer against one task.
 * @param {string} rawOutput the model's raw response
 * @param {{id:string, requires?:string[]}} task
 */
export function scoreOutput(rawOutput, task) {
  const cm = extractChromaMark(rawOutput);
  const diagnostics = lint(cm);
  const used = usedConstructs(cm);
  const required = task.requires || [];
  const missing = required.filter((r) => !used.includes(r));
  const valid = diagnostics.length === 0;
  return {
    id: task.id,
    valid,
    diagnostics,
    used,
    missing,
    pass: valid && missing.length === 0,
    output: cm,
  };
}
