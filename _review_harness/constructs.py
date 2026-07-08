"""Constructs with adversarial whitespace / unicode / emoji / CJK / combining."""
from diff import run

# Whitespace-ish code points that differ between JS and Python notions of \s / trim
WS = {
    "SP": "\u0020", "TAB": "\u0009", "NBSP": "\u00a0", "OGHAM": "\u1680",
    "ENQUAD": "\u2000", "HAIR": "\u200a", "LINESEP": "\u2028", "PARASEP": "\u2029",
    "NNBSP": "\u202f", "MMSP": "\u205f", "IDEO": "\u3000", "BOM": "\ufeff",
    "VTAB": "\u000b", "FF": "\u000c", "NEL": "\u0085", "FS": "\u001c",
    "GS": "\u001d", "RS": "\u001e", "US": "\u001f", "MONGVS": "\u180e",
    "ZWSP": "\u200b", "ZWNJ": "\u200c",
}

cases = []
# whitespace between spec token and label (pill, text, meter)
for name, ws in WS.items():
    cases.append(f"[!ok{ws}Label]")
    cases.append(f"[.info{ws}Label]")
    cases.append(f"[=info{ws}50%]")
    # trailing whitespace inside brackets (exercise trim + empty-rest logic)
    cases.append(f"[!ok Label{ws}]")
    cases.append(f"[.info Label{ws}]")
    cases.append(f"[!ok{ws}]")           # only ws after spec -> empty rest?
    cases.append(f"[.info{ws}]")
    # leading whitespace inside brackets
    cases.append(f"[!{ws}ok Label]")
    # container openers with the ws separating tokens
    cases.append(f":::{ws}note title\nbody\n:::")
    cases.append(f"::: note{ws}My Title\nbody\n:::")
    cases.append(f"::: details{ws}open{ws}note{ws}Summary\nx\n:::")

# emoji / CJK / combining / ZWJ sequences in labels (escape passthrough)
LABELS = [
    "café", "e\u0301", "naïve", "😀", "👍🏽", "👨‍👩‍👧‍👦", "🇺🇸",
    "日本語", "中文标签", "한국어", "العربية", "עברית", "\u200bzero",
    "a\u0300\u0301\u0302b", "𝕏 math", "e=mc²", "tab\tinside", "line\u2028sep",
    "<b>&amp;</b>", "\"quoted\"", "back\\slash", "100%done", "a/b/c",
]
for lb in LABELS:
    cases.append(f"[!ok {lb}]")
    cases.append(f"[.info {lb}]")
    cases.append(f"[=info 50%] {lb}")
    cases.append(f"::: note {lb}\nbody {lb}\n:::")
    cases.append(f"::: fields\nKey {lb}: value {lb}\n:::")

# very long labels / empty bodies
cases.append("[!ok " + "x" * 5000 + "]")
cases.append("[.info " + "长" * 2000 + "]")
cases.append("[!]")
cases.append("[! ]")
cases.append("[!  ]")
cases.append("[.]")
cases.append("[. ]")
cases.append("[=]")
cases.append("[= ]")
cases.append("[=info ]")
cases.append("[!ok]")
cases.append("[.info]")
cases.append("[!#f00]")
cases.append("[!#f00 ]")
cases.append("[!color=red]")
cases.append("[!color=red ]")

if __name__ == "__main__":
    d = run(cases, "constructs+whitespace", limit=200)
    print(f"CONSTRUCT DIFFS: {len(d)}")
