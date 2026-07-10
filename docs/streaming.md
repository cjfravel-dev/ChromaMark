# Incremental streaming

`createStreamingRenderer()` accepts append-only text chunks and returns an HTML
snapshot after each append. It commits only block boundaries that are both
render-isolated and safe from known retroactive reference-link changes; only the
mutable tail is reparsed for later snapshots.

```js
import { createStreamingRenderer } from '@chromamark/renderer';

const stream = createStreamingRenderer();
stream.append('::: success Deploy\n');
stream.append('Ready [!pass]\n');
const snapshot = stream.append(':::\n');
const final = stream.finalize();
```

Every snapshot contains:

- `html` — complete current HTML
- `committedHtml` — immutable prefix HTML
- `tailHtml` — replaceable suffix HTML
- `sourceLength`
- `finalized`
- `metrics` — primary parsed characters, conservative verification characters,
  committed characters, and render count

`finalize()` always performs a normal full render and uses it as the correctness
authority, so final HTML is byte-identical to `render(fullSource)`.

## Browser DOM patching

`createStreamingElement(target)` wraps the same parser session with two internal
DOM regions. Newly committed HTML is appended to the stable region, preserving
existing node identity; only the mutable tail region is replaced.

```js
import { createStreamingElement } from '@chromamark/renderer/browser';

const stream = createStreamingElement('#report');
stream.append(tokenChunk);
stream.finalize();
```

The API is append-only. Calling `append()` after finalization throws.
