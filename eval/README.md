# @chromamark/eval

A small harness that measures **how reliably an LLM emits valid ChromaMark** when
taught the format with only [`docs/llms.txt`](../docs/llms.txt). It prompts each
model with a set of report-writing tasks, then scores the answers with the real
[`lint`](../packages/renderer) and renderer — turning "designed for LLMs" into a
number you can track.

## What "pass" means

An answer passes a task when it is both:

1. **Valid** — `lint()` finds no problems (no backtick-wrapped pills, unknown
   tones, bad meters, or unclosed blocks), and
2. **Complete** — it actually renders every construct the task asked for (e.g. a
   colored block, a fields list, a table with pills).

## Run it

```bash
# offline demo with canned answers (no network, no keys):
node eval/run.js

# render the report in your terminal:
node eval/run.js | npx @chromamark/cli render

# against real models (set the matching env keys first):
OPENAI_API_KEY=…    node eval/run.js --provider openai:gpt-4o
ANTHROPIC_API_KEY=… node eval/run.js --provider anthropic:claude-3-5-sonnet-latest
node eval/run.js --provider openai:gpt-4o --provider anthropic   # compare both

# gate CI on a threshold, or get raw JSON:
node eval/run.js --provider openai --fail-under 80
node eval/run.js --json
```

Task filters must name existing task IDs, and `--fail-under` accepts a number
from 0 through 100. Missing option values, unknown task IDs/providers, and
unreadable system-prompt paths exit non-zero with an explicit error.

### Providers

| Spec                | Backend                          | Env                                   |
| ------------------- | -------------------------------- | ------------------------------------- |
| `mock`              | offline replay (default)         | —                                     |
| `openai[:model]`    | OpenAI-compatible chat API       | `OPENAI_API_KEY`, `OPENAI_BASE_URL`   |
| `anthropic[:model]` | Anthropic Messages API           | `ANTHROPIC_API_KEY`                   |

`openai` speaks the standard chat-completions API, so it also works with Azure
OpenAI, GitHub Models, or a local server via `OPENAI_BASE_URL`.

## Layout

```
eval/
├── tasks.js       the task set (instruction + required constructs)
├── providers.js   mock / OpenAI-compatible / Anthropic adapters
├── fixtures.js    canned answers for the mock provider
├── score.js       validity + completeness scoring (reuses lint + renderer)
└── run.js         runner, ChromaMark report, and CLI
```

## Extending

Add tasks to `tasks.js` (each lists the construct kinds it `requires`) and, if you
want the offline demo to cover them, a matching answer in `fixtures.js`. Scoring
and reporting pick them up automatically.
