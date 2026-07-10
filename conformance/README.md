# ChromaMark public conformance kit

This directory is the canonical, language-neutral rendering contract shared by
the JavaScript and Python implementations and published as
[`@chromamark/conformance`](https://www.npmjs.com/package/@chromamark/conformance).

`cases.json` contains rendering fixtures, `lint-cases.json` contains exact
cross-runtime diagnostic fixtures, `schema.json` defines the rendering corpus
structure, and [`protocol.md`](./protocol.md) defines implementation-independent runner
behavior. `version` identifies the corpus schema, while
`languageVersion` identifies the ChromaMark language contract. Each case contains:

- `name` — a unique human-readable identifier
- `source` — ChromaMark input
- `options` — optional renderer feature flags
- `html` — the exact expected HTML

Both implementations run every case in their normal test suites:

```bash
node --test packages/renderer/test/conformance.test.js
packages/python/.venv/bin/python -m pytest -q packages/python/tests/test_conformance.py
```

JavaScript implementations can use the packaged runner:

```js
import { loadCorpus, runConformance } from '@chromamark/conformance';

const result = await runConformance(render, {
  corpus: loadCorpus(),
  languageVersion: '0.1',
});
```

Other languages can consume `cases.json` and `schema.json` directly by following
the runner protocol. Comparisons are byte-exact; whitespace and HTML
serialization must not be normalized.

When behavior intentionally changes, update the specification and corpus in the
same pull request. Do not regenerate expectations without reviewing the HTML:
the checked-in output is the compatibility contract, not a snapshot of whichever
implementation ran last.
