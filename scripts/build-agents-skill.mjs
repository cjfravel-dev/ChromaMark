/**
 * Generates the installable ChromaMark authoring skill from docs/llms.txt so the
 * agent-facing reference has a single source of truth. Mirrors the conformance
 * kit workflow: `node scripts/build-agents-skill.mjs` writes the file and
 * `--check` fails when the committed skill drifts from docs/llms.txt.
 *
 * Consumers install it with `npx skills add cjfravel-dev/ChromaMark`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

export const LLMS_PATH = join(root, 'docs/llms.txt');
export const SKILL_PATH = join(root, '.agents/skills/chromamark-authoring/SKILL.md');

const FRONTMATTER = `---
name: chromamark-authoring
description: >-
  Author ChromaMark (.cm) — a stream-safe Markdown superset for AI→human reports
  that encodes semantic state (status, severity, pass/fail, progress, fields,
  and change tracking) as callouts, pills, colored text, and meters. Use when
  writing, emitting, or reviewing .cm reports or rich agent report output.
---`;

const WORKFLOW = `# ChromaMark authoring

ChromaMark is Markdown (CommonMark + GFM) plus a few semantic constructs for
agent→human reports. Emit it as plain text with a \`.cm\` extension. Ordinary
Markdown always works, so when unsure, fall back to plain Markdown.

## Workflow

1. Write the report as \`.cm\`, using the constructs below to encode *state*
   (status, severity, progress, fields) instead of describing it in prose.
2. Keep every ChromaMark construct **bare** — never inside backticks or code
   spans, or it renders as literal text.
3. Validate before shipping: \`npx @chromamark/cli lint report.cm\` (or
   \`chromamark lint report.cm\`) catches the common mistakes.

## Syntax reference`;

export function renderSkill(llms) {
  const reference = String(llms)
    .replace(/^# ChromaMark — LLM quick reference\n/, '')
    .replace(/^\s*License:[^\n]*\n/m, '')
    .trim();
  return `${FRONTMATTER}\n\n${WORKFLOW}\n\n${reference}\n`;
}

function main(argv) {
  const llms = readFileSync(LLMS_PATH, 'utf8');
  const rendered = renderSkill(llms);
  if (argv.includes('--check')) {
    let current = '';
    try {
      current = readFileSync(SKILL_PATH, 'utf8');
    } catch {}
    if (current !== rendered) {
      process.stderr.write(
        'Agent skill is out of date. Run `npm run build:agents` to regenerate.\n',
      );
      process.exit(1);
    }
    return;
  }
  mkdirSync(dirname(SKILL_PATH), { recursive: true });
  writeFileSync(SKILL_PATH, rendered);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2));
}
