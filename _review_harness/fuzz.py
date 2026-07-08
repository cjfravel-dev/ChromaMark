"""Randomized differential fuzz over ChromaMark + markdown + URLs."""
import random
from diff import run

random.seed(1234)

FRAGMENTS = [
    "[!ok ", "[!danger ", "[.info ", "[=info ", "[=warn ", "]", "[#f00 ",
    "[color=red ", "::: note\n", "::: details open S\n", "::: fields\n",
    "\n:::\n", "{++", "++}", "{--", "--}", "{~~", "~>", "~~}", "{==", "==}",
    "{>>", "<<}", "**", "*", "_", "`", "~~", "https://x.com", "www.y.org",
    "a@b.com", " ", "\n", "\t", "text", "日本", "😀", "café", "3/7", "50%",
    "12.5%", "| a | b |\n", "| --- | --- |\n", "> ", "# ", "- ", "\\", ":",
    "key: value", "\u00a0", "\ufeff", "\x85", "[link](https://z.com)", ".",
    ",", ")", "(", "<b>", "&amp;", "100%", "0/0", "★.com", "🎉.com",
]

cases = []
for _ in range(6000):
    n = random.randint(1, 8)
    cases.append("".join(random.choice(FRAGMENTS) for _ in range(n)))

if __name__ == "__main__":
    d = run(cases, "random-fuzz", limit=40)
    # summarize whether every diff contains one of the known-divergent chars
    known = ["\ufeff", "\x85", "\x1c", "\x1d", "\x1e", "\x1f", "🎉", "😀"]
    unexplained = [(s, j, p) for (s, j, p) in d
                   if not any(k in s for k in known)]
    print(f"FUZZ DIFFS: {len(d)}   UNEXPLAINED (no known-divergent char): {len(unexplained)}")
    for s, j, p in unexplained[:40]:
        print(f"  INPUT: {s!r}")
        print(f"    JS : {j!r}")
        print(f"    PY : {p!r}")
