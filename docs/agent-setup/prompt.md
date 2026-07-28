# ChromaMark agent setup

These are official instructions to make an AI agent emit **ChromaMark** by
default for its human-facing reports. ChromaMark is a strict superset of
GitHub-Flavored Markdown, so following this is always safe: where a surface
renders ChromaMark it gains color and semantic styling, and everywhere else it
degrades to clean, readable Markdown.

Complete every step yourself by running the commands directly. Do not ask the
user to run them.

- Install the always-on ChromaMark output-style directive for your host.
- (Recommended) Install the ChromaMark authoring skill.
- Confirm what you changed.

---

## Step 1 — Install the output-style directive

Pick the row that matches the agent you are, fetch the linked file, and write it
to the destination for this project. Wrap the inserted content between these
markers so a re-run **replaces** it instead of duplicating:

```
<!-- chromamark:output-style:start -->
…fetched content…
<!-- chromamark:output-style:end -->
```

If the destination file already contains those markers, replace the block
between them. Otherwise append the marked block to the end of the file (create
the file and any parent directories if they do not exist). Do not delete
existing content.

| If you are…            | Destination (in the project)         | Fetch this file |
| ---------------------- | ------------------------------------ | --------------- |
| GitHub Copilot         | `.github/copilot-instructions.md`    | [`copilot-instructions.md`](https://raw.githubusercontent.com/cjfravel-dev/ChromaMark/main/.agents/output-style/copilot-instructions.md) |
| Claude Code            | `CLAUDE.md`                          | [`CLAUDE.md`](https://raw.githubusercontent.com/cjfravel-dev/ChromaMark/main/.agents/output-style/CLAUDE.md) |
| Cursor                 | `.cursor/rules/chromamark.mdc`       | [`cursor.mdc`](https://raw.githubusercontent.com/cjfravel-dev/ChromaMark/main/.agents/output-style/cursor.mdc) |
| Windsurf               | `.windsurf/rules/chromamark.md`      | [`windsurf.md`](https://raw.githubusercontent.com/cjfravel-dev/ChromaMark/main/.agents/output-style/windsurf.md) |
| Codex / any other host | `AGENTS.md`                          | [`AGENTS.md`](https://raw.githubusercontent.com/cjfravel-dev/ChromaMark/main/.agents/output-style/AGENTS.md) |

The Cursor (`.mdc`) and Windsurf files already carry the always-on frontmatter
their host expects — write them verbatim, frontmatter included. For the plain
Markdown destinations (`AGENTS.md`, `copilot-instructions.md`, `CLAUDE.md`),
write the fetched content as-is inside the markers.

If you cannot determine which host you are, use the `AGENTS.md` row.

## Step 2 — Install the authoring skill (recommended)

The skill gives you the full ChromaMark syntax reference and a lint workflow so
your output stays correct:

```
npx -y skills add cjfravel-dev/ChromaMark --yes
```

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
│  ✓ Authoring skill installed (or skipped)            │
│                                                      │
│  Reports will now be formatted in ChromaMark by      │
│  default, degrading to plain Markdown anywhere it    │
│  isn't natively rendered.                            │
└──────────────────────────────────────────────────────┘
```

## Resources

- ChromaMark repository: `https://github.com/cjfravel-dev/ChromaMark`
- Playground (see it rendered): `https://cjfravel-dev.github.io/ChromaMark/playground/`
- Specification: `https://cjfravel-dev.github.io/ChromaMark/spec.html`

These instructions are published at
`https://cjfravel-dev.github.io/ChromaMark/agent-setup/prompt.md` so you can
re-verify their authenticity at any time.
