# ChromaMark conformance corpus

`cases.json` is the language-neutral rendering contract shared by the JavaScript
and Python implementations. `version` identifies the corpus schema, while
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

When behavior intentionally changes, update the specification and corpus in the
same pull request. Do not regenerate expectations without reviewing the HTML:
the checked-in output is the compatibility contract, not a snapshot of whichever
implementation ran last.
