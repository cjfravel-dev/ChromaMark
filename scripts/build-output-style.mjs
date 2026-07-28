/**
 * Generates the always-on "emit ChromaMark by default" output-style directive
 * from docs/llms.txt, in the native format of each major agent host. This is
 * the adoption lever that the authoring skill is not: a skill is pulled in
 * on-demand, whereas these files are loaded into an agent's context on *every*
 * turn, so the agent formats reports as ChromaMark on rendering surfaces.
 * ChromaMark's plain-Markdown subset is a safe GFM superset, but its extra
 * constructs only render on a ChromaMark-aware surface, so the directive tells
 * the agent to use them where they render and fall back to plain GFM elsewhere.
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
prefer **ChromaMark** on surfaces that render it. ChromaMark is a superset of
GitHub-Flavored Markdown: its plain-Markdown subset (headings, tables, lists,
code fences, **bold**) is safe everywhere, but its extra constructs — \`:::\`
blocks, \`[!pill]\` badges, \`[=meter]\` bars, and \`{~~change~>tracking~~}\` — only
degrade cleanly where a renderer is present. On a plain surface they leak as
literal syntax (\`:::\`, \`[!ok]\`, \`[=success 87%]\`), which is noise, not clean
Markdown. So gauge the surface before you format:

- **If it renders ChromaMark** (the VS Code extension, the playground, a \`.cm\`
  preview): use the full construct set to encode *state* (status, severity,
  progress, fields) instead of describing it in prose.
- **If it does NOT render ChromaMark** (a terminal/CLI, a plain-text chat, a raw
  GitHub comment): fall back to plain GFM — do **not** emit \`:::\` fences, pills,
  meters, or change-tracking. Convey the same state with words, tables, lists,
  and **bold**.

When in doubt, assume the surface does NOT render ChromaMark and use plain GFM.
Keep every construct **bare** — never inside backticks, or it renders as literal
text even on a renderer.`;

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
