"""Differential harness: render a large battery through JS and Python, diff HTML."""
import json
import subprocess
import sys
import os

import chromamark

HERE = os.path.dirname(os.path.abspath(__file__))
JS_BRIDGE = os.path.join(HERE, "js_render.mjs")


def js_render_batch(cases):
    proc = subprocess.run(
        ["node", JS_BRIDGE],
        input=json.dumps(cases),
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        sys.stderr.write("NODE ERROR:\n" + proc.stderr + "\n")
        raise SystemExit(1)
    return json.loads(proc.stdout)


def run(cases, label, show_all=False, limit=None):
    py = [chromamark.render(s) for s in cases]
    js = js_render_batch(cases)
    diffs = []
    for i, s in enumerate(cases):
        if py[i] != js[i]:
            diffs.append((s, js[i], py[i]))
    print(f"===== {label}: {len(cases)} cases, {len(diffs)} DIFFS =====")
    shown = 0
    for s, j, p in diffs:
        if limit is not None and shown >= limit:
            print(f"  ... ({len(diffs) - shown} more diffs suppressed)")
            break
        shown += 1
        print(f"  INPUT : {s!r}")
        print(f"    JS  : {j}")
        print(f"    PY  : {p}")
    print()
    return diffs


# ---------------------------------------------------------------------------
# Category 1: linkify edge cases
# ---------------------------------------------------------------------------
LINKIFY = [
    "see https://x.com.",
    "(https://x.com)",
    "https://x.com,",
    "https://x.com;",
    "https://x.com:",
    "https://x.com!",
    "https://x.com?",
    "https://x.com...",
    "\"https://x.com\"",
    "https://x.com's page",
    "www.example.com",
    "See www.example.com.",
    "visit www.example.com, please",
    "email me@example.com",
    "<me@example.com>",
    "a+b@example.com",
    "first.last@sub.example.co.uk",
    "ftp://ftp.example.com",
    "ftp://ftp.example.com/file.txt",
    "mailto:me@example.com",
    "http://example.com:8080/path",
    "https://example.com/a/b?x=1&y=2#frag",
    "https://例え.jp/パス",
    "https://xn--r8jz45g.jp",
    "https://example.com/path_(paren)",
    "https://en.wikipedia.org/wiki/Foo_(bar)",
    "text https://a.com/b) more",
    "http://localhost",
    "http://localhost:3000/x",
    "http://127.0.0.1",
    "http://127.0.0.1:8080/p",
    "http://1.1.1.1",
    "https://user:pass@example.com/secure",
    "HTTP://EXAMPLE.COM",
    "HTTPS://Example.Com/Path",
    "example.com",
    "google.com",
    "sub.example.io",
    "foo.bar.baz.qux",
    "reach me at test@localhost",
    "path www.a.com/b?c=d&e=f#g end",
    "git+https://github.com/x/y.git",
    "https://example.com/#",
    "https://example.com?",
    "https://example.com.,;",
    "[already](https://x.com)",
    "[already](https://x.com) and bare https://y.com",
    "https://a.com/foo,bar",
    "https://a.com/foo.",
    "prefix:https://a.com",
    "see(https://x.com)done",
    "«https://x.com»",
    "https://x.com、next",  # CJK comma
    "。https://x.com",
    "https://tools.ietf.org/html/rfc3986#section-3.4",
    "ssh://git@example.com",
    "tel:+15551234567",
    "data:text/plain,hello",
    "file:///etc/hosts",
    "www.xn--r8jz45g.jp",
    "test@例え.jp",
    "Visit https://x.com/a_b_c and www.d-e.f/g.",
    "https://x.com/path?a=1&b=<script>",
    "URL https://x.com/<b>bold</b> here",
    "**https://x.com**",
    "`https://x.com`",
    "> https://x.com",
    "# Heading https://x.com",
    "- https://x.com",
    "1. https://x.com",
    "https://例え.テスト",
    "email: A.B.C@Example.COM",
    "user@[192.168.1.1]",
    "http://例え.jp:8080/パス?q=あ#フラグ",
    "見て https://x.com ください",
    "https://x.com\nhttps://y.com",
    "multiple https://a.com https://b.com https://c.com",
    "http://a.b/c(d)e",
    "https://x.com/foo#bar?baz",
    "no scheme www.example.com/path.",
    "trailing www.example.com!",
]

# URLs adjacent to / inside ChromaMark constructs
LINKIFY_CM = [
    "[!ok see https://x.com]",
    "[.info visit www.x.com]",
    "[=info 3/7] then https://x.com",
    "https://x.com[!ok tag]",
    "[!ok tag]https://x.com",
    "::: note\nSee https://x.com for details.\n:::",
    "::: fields\nSite: https://x.com\nMail: me@example.com\n:::",
    "| Link | Desc |\n| --- | --- |\n| https://x.com | site |",
    "| Link |\n| --- |\n| www.x.com |",
    "> quote https://x.com end",
    "## Section https://x.com",
    "::: details Summary https://x.com\nbody\n:::",
    "{++https://x.com++}",
    "{==see www.x.com==}",
    "[!ok https://x.com]",
    "text [note](https://x.com) [!ok done] https://y.com",
]


if __name__ == "__main__":
    total = 0
    total += len(run(LINKIFY, "linkify"))
    total += len(run(LINKIFY_CM, "linkify-in-constructs"))
    print(f"TOTAL DIFFS SO FAR: {total}")
