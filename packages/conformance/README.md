# @chromamark/conformance

Public, versioned conformance kit for ChromaMark implementations. It ships:

- the exact-HTML corpus in `cases.json`
- the cross-runtime diagnostic corpus in `lint-cases.json`
- its Draft 2020-12 JSON Schema in `schema.json`
- validation helpers
- an async runner for JavaScript implementations
- TypeScript declarations

## Install

```bash
npm install --save-dev @chromamark/conformance
```

## JavaScript runner

```js
import {
  loadCorpus,
  loadSchema,
  validateCorpus,
  runConformance,
} from '@chromamark/conformance';
import { render, LANGUAGE_VERSION } from 'your-chromamark-renderer';

const corpus = loadCorpus();
const errors = validateCorpus(corpus);
const schema = loadSchema();
const result = await runConformance(render, {
  corpus,
  languageVersion: LANGUAGE_VERSION,
});

if (!result.ok) {
  for (const failure of result.failures) console.error(failure);
  process.exitCode = 1;
}
```

The render callback receives `(source, options)` and may return an HTML string
or a promise for one. Comparison is byte-exact.

## Language-neutral use

Other languages can consume the exported JSON directly:

```text
@chromamark/conformance/cases.json
@chromamark/conformance/lint-cases.json
@chromamark/conformance/schema.json
```

The same files are available in the repository's
[`conformance/`](https://github.com/cjfravel-dev/ChromaMark/tree/main/conformance)
directory. See the
[runner protocol](https://github.com/cjfravel-dev/ChromaMark/blob/main/conformance/protocol.md)
for implementation-independent requirements.

## Versioning

The npm package follows SemVer. `version` in `cases.json` versions the corpus
schema, while `languageVersion` identifies the ChromaMark language contract.
Package releases may add fixtures without changing either value when they only
increase coverage of existing behavior.

## License

The runner, schema, and executable corpus are licensed under MIT so third-party
implementations can reuse them without imposing ShareAlike on their code or
tests. See `LICENSE.md`.
