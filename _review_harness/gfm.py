"""CriticMarkup, GFM/CommonMark core, nesting, fields, tables batteries."""
from diff import run

critic = [
    "{++add++}", "{--del--}", "{~~old~>new~~}", "{==mark==}", "{>>note<<}",
    "{++a++}{--b--}", "{++a++}{++b++}", "{++ {--x--} ++}", "{--{++y++}--}",
    "{++unclosed", "{--no close", "{~~old~~}", "{~~~>new~~}", "{~~a~>b~>c~~}",
    "{++++}", "{----}", "{~~~~}", "{====}", "{>><<}", "{", "}", "{}", "{++}",
    "{--}", "{~~}", "text {++ins++} and {--del--} end", "{==a==}{==b==}",
    "pre{>>c<<}post", "{~~*x*~>_y_~~}", "{++<b>++}", "{--&amp;--}",
    "{++line1\nline2++}", "{++tab\there++}", "a{++x++}b{--y--}c",
    "{++é 日本 😀++}", "{~~http://a.com~>http://b.com~~}", "nested {++a {++b++} c++}",
    "{++a++]", "[{++x++}]", "{>>a<<}{>>b<<}", "{~~~~~}", "{+++++}",
]

gfm = [
    "| a | b |\n| --- | --- |\n| 1 | 2 |",
    "| a | b |\n|:---|---:|\n| 1 | 2 |",
    "| a | b |\n|:--:|:--:|\n| 1 | 2 |",
    "| a \\| b | c |\n| --- | --- |\n| x | y |",
    "| `code|pipe` | b |\n| --- | --- |\n| x | y |",
    "| a | b |\n| --- | --- |\n| very long cell content here | 2 |",
    "no leading pipe a | b\n--- | ---\n1 | 2",
    "| a | b | c |\n| --- | --- |\n| 1 | 2 |",
    "| a |\n| --- |\n| line1<br>line2 |",
    "~~strike~~", "~~a~~ and ~~b~~", "a ~~ b ~~ c", "~~~~", "~~ ~~",
    "text with  \ntwo-space break", "text with\\\nbackslash break",
    "hard\n\nsoft\nline", "&amp; &lt; &copy; &#169; &#x41; &unknownent;",
    "&nbsp;", "&", "&;", "<not html>", "<b>bold</b>", "a < b and c > d",
    "`code span`", "`` ` ``", "``a`b``", "~~~\ncode\n~~~", "```js\nx=1\n```",
    "    indented code", "> blockquote", ">> nested quote",
    "[ref][1]\n\n[1]: https://example.com", "[ref][1]\n\n[1]: /x \"title\"",
    "![alt](img.png)", "![alt](img.png \"t\")", "![a<b](x.png)",
    "1. one\n2. two", "- a\n- b\n- c", "* x\n  * y", "1) a\n2) b",
    "term\n: def", "## Heading ##", "Setext\n===", "---", "***", "___",
    "\\* escaped", "\\[esc\\]", "a\\\\b", "line\ttab", "trailing spaces   ",
    "foo\r\nbar\r\nbaz", "\ufeffleading bom text", "mixed\r\rCR",
    "<https://autolink.com>", "<mailto:a@b.com>", "<http://a.com/x?y=1>",
    "text_with_underscores", "a*b*c", "**bold** _em_ ***both***",
    "1<2<3", "x&y&z", "\"smart\" 'quotes' -- ---", "(c) (r) (tm)",
    "e.g. i.e. ... !!! ???",
]

nesting = [
    "::::: outer\n::: inner\nx\n:::\n:::::",
    "::: outer\n::: inner\nx\n:::\n:::",  # equal colons
    ":::: a\n::: b\ntext\n:::\n::::",
    "::: note\nno close",
    "::: note\n:::\n:::",
    "::: details open Summary\n::: fields\nK: V\n:::\n:::",
    "::: fields\nK1: V1\nK2: V2\n:::",
    "::: fields\nNoColon\nK: V\n:::",
    "::: fields\nMulti: a: b: c\n:::",
    "::: fields\n: emptykey\n:::",
    "::: fields\nKey:\n:::",
    "::: fields\n   \nK: V\n:::",       # blank-ish line
    "::: fields\nKéy: Vàl\n:::",
    "::: fields\nURL: https://x.com\n:::",
    "::: fields\nCode: `x`\nBold: **y**\nLink: [z](https://z.com)\n:::",
    "::: fields\n\tTabKey\t:\tTabVal\n:::",
    "::: note title\n\n\nblank lines inside\n\n:::",
    "::: note\n    indented four\n:::",
    "::: note\n> quote inside\n:::",
    "::: note\n- list\n- items\n:::",
    "::: note\n| t | b |\n| --- | --- |\n| 1 | 2 |\n:::",
    "::::\nbody with bare block\n::::",
    "::: block\ncontent\n:::",
    "::: block My Title\nc\n:::",
    "::: color=red Title\nc\n:::",
    "::: color=#abc Title\nc\n:::",
    "::: unknowntone title\nc\n:::",
    "::: details\nc\n:::",
    "::: details note open extra words here\nc\n:::",
    "::: DETAILS OPEN Foo\nc\n:::",
    "text before\n::: note\nc\n:::\ntext after",
    "::: note\r\nCRLF body\r\n:::",
    "   ::: note\n   indented fence\n   :::",
    ":::note nospace\nc\n:::",
]

if __name__ == "__main__":
    n = 0
    n += len(run(critic, "critic", limit=80))
    n += len(run(gfm, "gfm/commonmark", limit=80))
    n += len(run(nesting, "nesting/fields", limit=80))
    print(f"TOTAL DIFFS: {n}")
