/**
 * Generates the always-on "emit ChromaMark by default" output-style directive
 * from docs/llms.txt, in the native format of each major agent host. This is
 * the adoption lever that the authoring skill is not: a skill is pulled in
 * on-demand, whereas these files are loaded into an agent's context on *every*
 * turn, so the agent formats reports as ChromaMark by default. Because
 * ChromaMark is a strict GFM superset, the directive is always safe to follow —
 * it degrades to clean Markdown anywhere it isn't natively rendered.
 *
 * `node scripts/build-output-style.mjs` writes the files; `--check` fails when a
 * committed file drifts from docs/llms.txt (mirrors build-agents-skill.mjs).
 * The setup prompt copies each file into its host's always-on instructions
 * location (AGENTS.md, .github/copilot-instructions.md, .cursor/rules,
 * CLAUDE.md, .windsurf/rules).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

export const LLMS_PATH = join(root, 'docs/llms.txt');
export const OUTPUT_DIR = join(root, '.agents/output-style');

/** The standing instruction — the part that makes ChromaMark the *default*. */
const DIRECTIVE = `# Default report format: ChromaMark

When you emit status, results, a summary, a report, or a review for a human,
format it in **ChromaMark** by default. ChromaMark is a strict superset of
GitHub-Flavored Markdown, so it is always safe to place directly in your reply:
where a surface renders it natively it gains color and semantic styling, and
everywhere else it degrades to clean, readable Markdown. Encode *state* (status,
severity, progress, fields) with the constructs below instead of describing it
in prose. Keep every construct **bare** — never inside backticks, or it renders
as literal text. When a construct doesn't fit, plain Markdown always works.`;

/** Pull the syntax reference out of docs/llms.txt (drop its title + license). */
export function referenceFrom(llms) {
  return String(llms)
    .replace(/^# ChromaMark — LLM quick reference\n/, '')
    .replace(/^\s*License:[^\n]*\n/m, '')
    .trim();
}

/** The shared directive body: standing instruction + condensed syntax. */
export function renderBody(llms) {
  return `${DIRECTIVE}\n\n## ChromaMark syntax\n\n${referenceFrom(llms)}\n`;
}

const CURSOR_FRONTMATTER = `---
description: Emit ChromaMark (GFM-superset) for reports, status, and summaries by default.
alwaysApply: true
---`;

const WINDSURF_FRONTMATTER = `---
trigger: always_on
---`;

/**
 * Render every host target. Each value is the file content in that host's
 * native always-on instructions format; only the wrapper differs.
 */
export function renderOutputStyle(llms) {
  const body = renderBody(llms);
  return {
    'AGENTS.md': body,
    'copilot-instructions.md': body,
    'CLAUDE.md': body,
    'cursor.mdc': `${CURSOR_FRONTMATTER}\n\n${body}`,
    'windsurf.md': `${WINDSURF_FRONTMATTER}\n\n${body}`,
  };
}

/** Where each rendered file is written (and checked). */
export const TARGETS = ['AGENTS.md', 'copilot-instructions.md', 'CLAUDE.md', 'cursor.mdc', 'windsurf.md']
  .map((name) => ({ name, path: join(OUTPUT_DIR, name) }));

function main(argv) {
  const llms = readFileSync(LLMS_PATH, 'utf8');
  const rendered = renderOutputStyle(llms);
  if (argv.includes('--check')) {
    for (const { name, path } of TARGETS) {
      let current = '';
      try {
        current = readFileSync(path, 'utf8');
      } catch {}
      if (current !== rendered[name]) {
        process.stderr.write(
          'Output-style directives are out of date. Run `npm run build:output-style` to regenerate.\n',
        );
        process.exit(1);
      }
    }
    return;
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const { name, path } of TARGETS) writeFileSync(path, rendered[name]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2));
}
