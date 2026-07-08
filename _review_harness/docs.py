"""Diff the full real documents through both renderers."""
import os
from diff import js_render_batch
import chromamark

ROOT = "/mnt/fast/source/ChromaMark"
DOCS = [
    "examples/demo.cm",
    "docs/integrations.cm",
    "docs/llms.txt",
    "SPEC.md",
    "README.md",
]

texts = []
for d in DOCS:
    with open(os.path.join(ROOT, d), encoding="utf-8") as f:
        texts.append(f.read())

py = [chromamark.render(t) for t in texts]
js = js_render_batch(texts)

anydiff = 0
for name, t, j, p in zip(DOCS, texts, js, py):
    if j == p:
        print(f"OK  {name}  ({len(j)} bytes, identical)")
    else:
        anydiff += 1
        print(f"DIFF {name}")
        # find first differing offset
        n = min(len(j), len(p))
        for i in range(n):
            if j[i] != p[i]:
                lo = max(0, i - 60)
                print(f"  first diff at offset {i}")
                print(f"    JS ...{j[lo:i+60]!r}...")
                print(f"    PY ...{p[lo:i+60]!r}...")
                break
        else:
            print(f"  length differs: JS={len(j)} PY={len(p)}")
            print(f"    JS tail: {j[n-40:]!r}")
            print(f"    PY tail: {p[n-40:]!r}")
print(f"\nDOC DIFFS: {anydiff}/{len(DOCS)}")
