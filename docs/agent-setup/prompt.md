# ChromaMark agent setup

These are official instructions to make an AI agent prefer **ChromaMark** for
its human-facing reports on surfaces that render it. ChromaMark is a superset of
GitHub-Flavored Markdown: its plain-Markdown subset is safe everywhere, but its
extra constructs (`:::` blocks, `[!pill]` badges, `[=meter]` bars, and
`{~~change~>tracking~~}`) only render on a ChromaMark-aware surface and otherwise
leak as literal syntax. The directive you install below tells the agent to use
the full construct set where it renders and fall back to plain GFM everywhere
else.

Complete every step yourself by running the commands directly. Do not ask the
user to run them.

- Install the always-on ChromaMark output-style directive for your host.
- (Recommended) Install the ChromaMark authoring skill.
- Confirm what you changed.

---

## Step 1 — Install the output-style directive

Install the directive so it is always applied. **Prefer global scope** — a
single user-level file that applies to every project — so you don't have to
repeat this setup in each repository. Use **per-project scope** only when you
want ChromaMark for one repository, or when your host has no global file.

Pick the row that matches the agent you are, fetch the linked file, and write it
to the chosen destination. Wrap the inserted content between these markers so a
re-run **replaces** it instead of duplicating:

```
<!-- chromamark:output-style:start -->
…fetched content…
<!-- chromamark:output-style:end -->
```

If the destination file already contains those markers, replace the block
between them. Otherwise append the marked block to the end of the file (create
the file and any parent directories if they do not exist). Do not delete
existing content.

| If you are…            | Global destination (all projects)                   | Per-project destination          | Fetch this file |
| ---------------------- | --------------------------------------------------- | -------------------------------- | --------------- |
| GitHub Copilot         | `~/.copilot/copilot-instructions.md`                | `.github/copilot-instructions.md`| [`copilot-instructions.md`](https://raw.githubusercontent.com/cjfravel-dev/ChromaMark/main/.agents/output-style/copilot-instructions.md) |
| Claude Code            | `~/.claude/CLAUDE.md`                               | `CLAUDE.md`                      | [`CLAUDE.md`](https://raw.githubusercontent.com/cjfravel-dev/ChromaMark/main/.agents/output-style/CLAUDE.md) |
| Cursor                 | `~/.cursor/rules/chromamark.mdc` (or paste into Settings → Rules → User Rules) | `.cursor/rules/chromamark.mdc` | [`cursor.mdc`](https://raw.githubusercontent.com/cjfravel-dev/ChromaMark/main/.agents/output-style/cursor.mdc) |
| Windsurf               | `~/.codeium/windsurf/memories/global_rules.md`      | `.windsurf/rules/chromamark.md`  | [`windsurf.md`](https://raw.githubusercontent.com/cjfravel-dev/ChromaMark/main/.agents/output-style/windsurf.md) |
| Codex / any other host | `~/.codex/AGENTS.md`                                | `AGENTS.md`                      | [`AGENTS.md`](https://raw.githubusercontent.com/cjfravel-dev/ChromaMark/main/.agents/output-style/AGENTS.md) |

The Cursor (`.mdc`) and Windsurf per-project files carry the always-on
frontmatter their host expects — write them verbatim, frontmatter included. For
every other destination — the plain-Markdown files (`AGENTS.md`,
`copilot-instructions.md`, `CLAUDE.md`) and the always-on global rules files
(Windsurf `global_rules.md`, Cursor User Rules) — write the fetched content
inside the markers, dropping any leading frontmatter block, since those globals
are always applied by nature.

If you cannot determine which host you are, use the `AGENTS.md` row. If you
cannot tell whether a global destination is supported, fall back to the
per-project destination.

## Step 2 — Install the authoring skill (recommended)

The skill gives you the full ChromaMark syntax reference and a lint workflow so
your output stays correct. Run it from the directory where you want the skill
installed:

```
npx -y skills add cjfravel-dev/ChromaMark --yes
```

To match a **global** Step 1 install, install the skill at the user level too if
your host supports a personal skills directory (for example, GitHub Copilot CLI
reads `~/.copilot/skills/`) — copy `chromamark-authoring` there instead of into
a project. Note the `skills add` command pulls **every** skill published in the
repo; keep only `chromamark-authoring` unless you want the others.

If the `skills` tool is unavailable for your host, skip this step — the Step 1
directive already embeds the syntax you need.

## Step 3 — Validate (optional)

You can lint any ChromaMark you produce before shipping it:

```
npx -y @chromamark/cli lint report.cm
```

---

## Confirm

Once done, tell the user exactly what you changed, for example:

```
┌─ ChromaMark Setup Complete ──────────────────────────┐
│  ✓ Output-style directive → <destination path>       │
│  ✓ Scope → global (all projects) / this project      │
│  ✓ Authoring skill installed (or skipped)            │
│                                                      │
│  Reports will use ChromaMark on surfaces that        │
│  render it, and plain Markdown everywhere else.      │
└──────────────────────────────────────────────────────┘
```

## Resources

- ChromaMark repository: `https://github.com/cjfravel-dev/ChromaMark`
- Playground (see it rendered): `https://cjfravel-dev.github.io/ChromaMark/playground/`
- Specification: `https://cjfravel-dev.github.io/ChromaMark/spec.html`

These instructions are published at
`https://cjfravel-dev.github.io/ChromaMark/agent-setup/prompt.md` so you can
re-verify their authenticity at any time.
