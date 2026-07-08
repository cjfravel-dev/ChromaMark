"""Inline diff via CriticMarkup: {++add++} {--del--} {~~old~>new~~} {==mark==} {>>comment<<}."""

from markdown_it.common.utils import escapeHtml

KINDS = {
    "++": ("add", "++}"),
    "--": ("del", "--}"),
    "~~": ("sub", "~~}"),
    "==": ("mark", "==}"),
    ">>": ("comment", "<<}"),
}


def _rule(state, silent):
    start = state.pos
    src = state.src
    if start >= state.posMax or src[start] != "{":
        return False
    spec = KINDS.get(src[start + 1:start + 3])
    if not spec:
        return False
    kind, close = spec

    content_start = start + 3
    close_idx = src.find(close, content_start)
    if close_idx == -1 or close_idx + len(close) > state.posMax:
        return False

    raw = src[content_start:close_idx]
    if not silent:
        tok = state.push("cm_critic", "", 0)
        if kind == "sub":
            cut = raw.find("~>")
            tok.meta = {
                "kind": "sub",
                "old": raw if cut == -1 else raw[:cut],
                "neu": "" if cut == -1 else raw[cut + 2:],
            }
        else:
            tok.meta = {"kind": kind, "content": raw}

    state.pos = close_idx + len(close)
    return True


def critic_plugin(md):
    md.inline.ruler.before("emphasis", "cm_critic", _rule)

    def render_critic(self, tokens, idx, options, env):
        meta = tokens[idx].meta
        kind = meta["kind"]
        if kind == "add":
            return f'<ins class="crit-add">{escapeHtml(meta["content"])}</ins>'
        if kind == "del":
            return f'<del class="crit-del">{escapeHtml(meta["content"])}</del>'
        if kind == "sub":
            return (
                f'<del class="crit-del">{escapeHtml(meta["old"])}</del>'
                f'<ins class="crit-add">{escapeHtml(meta["neu"])}</ins>'
            )
        if kind == "mark":
            return f'<mark class="crit-mark">{escapeHtml(meta["content"])}</mark>'
        if kind == "comment":
            return f'<span class="crit-comment">{escapeHtml(meta["content"])}</span>'
        return ""

    md.add_render_rule("cm_critic", render_critic)
