# Contributing to ChromaMark

Thank you for improving ChromaMark. Changes should keep the specification,
JavaScript renderer, Python renderer, browser bundle, CLI, and editor integration
consistent where their capabilities overlap.

## Setup

```bash
npm ci

python3 -m venv packages/python/.venv
packages/python/.venv/bin/python -m pip install -e "packages/python[test]"
```

The committed npm lockfile is authoritative. Use `npm ci` for a clean checkout
and commit `package-lock.json` when dependency changes intentionally update it.

## Test-first workflow

Write the smallest test that expresses the desired behavior and confirm that it
fails before changing implementation code. Implement the behavior, make that
test pass, then run the narrowest relevant suite.

Cross-runtime rendering changes must update `conformance/cases.json` and pass in
both JavaScript and Python. Do not regenerate expected HTML without reviewing
it; the checked-in output is the compatibility contract.

Useful commands:

```bash
npm test --workspace @chromamark/renderer
npm test --workspace @chromamark/cli
npm run test:eval
npm run test:scripts
npm run build --workspace chromamark-vscode
npm test --workspace chromamark-vscode
npm run lint

packages/python/.venv/bin/python -m pytest -q packages/python/tests
packages/python/.venv/bin/python -m ruff check packages/python/src packages/python/tests

npm run coverage
```

## Generated artifacts

The browser files under `packages/renderer/dist/` are tracked because the
documented CDN path serves them directly. After renderer or browser API changes:

```bash
npm run build --workspace @chromamark/renderer
```

Commit the resulting dist changes. CI rebuilds the bundle and rejects drift. The
canonical theme is `packages/renderer/theme/chromamark.css`; its Python package
copy must remain byte-identical.

`README.cm` is the canonical repository README source. After changing it or the
GitHub transpiler, regenerate and commit `README.md`:

```bash
npm run build:readme
```

CI runs the same command in check mode and rejects drift.

## Language changes

Changes to accepted syntax, degradation, safety, or rendered output require:

1. A specification update.
2. EBNF updates when syntax changes.
3. Shared conformance cases.
4. JavaScript and Python tests.
5. Compatibility and changelog notes when user-visible behavior changes.

See the [compatibility policy](./docs/compatibility.md) for the authority and
versioning rules.

## Pull requests

Keep each pull request focused and explain the behavior change, RED/GREEN test
sequence, and affected public surfaces. Use Conventional Commit-style titles;
the repository squash-merges pull requests.

By submitting a contribution, you represent that you have the right to submit
it and agree to license:

- Code contributions under the MIT License.
- Specification contributions to `SPEC.md`, `docs/grammar.ebnf`,
  `docs/llms.txt`, or `docs/compatibility.md` under CC BY-SA 4.0.
