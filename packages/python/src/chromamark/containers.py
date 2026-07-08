"""Block-level ChromaMark containers: ::: callout / details / fields."""

from markdown_it.common.utils import escapeHtml

from .tones import parse_spec, resolve_tone

MIN_FENCE = 3


def _cap(s):
    return s[:1].upper() + s[1:]


def _parse_opener(info):
    if not info:
        return None
    tokens = info.split()
    kind = tokens.pop(0).lower()

    tone = None
    color = None
    is_open = False

    if kind == "details":
        structure = "details"
    elif kind == "fields":
        return {"structure": "fields"}
    elif kind == "block":
        structure = "callout"
    else:
        t = resolve_tone(kind)
        if not t:
            return None
        structure = "callout"
        tone = t

    while tokens:
        tk = tokens[0]
        low = tk.lower()
        if structure == "details" and low == "open":
            is_open = True
            tokens.pop(0)
            continue
        if low.startswith("color="):
            spec = parse_spec(tk)
            if spec and spec["color"]:
                color = spec["color"]
                tokens.pop(0)
                continue
            break
        if structure == "details" and tone is None and resolve_tone(tk):
            tone = resolve_tone(tk)
            tokens.pop(0)
            continue
        break

    rest = " ".join(tokens).strip()
    if structure == "details":
        return {"structure": "details", "tone": tone, "color": color,
                "open": is_open, "summary": rest or "Details"}
    return {"structure": structure, "tone": tone, "color": color,
            "title": rest or (_cap(tone) if tone else "")}


def _fence_len(src, pos, maximum):
    count = 0
    p = pos
    while p < maximum and src[p] == ":":
        count += 1
        p += 1
    return count


def _make_rule(enabled):
    def chroma_container(state, startLine, endLine, silent):
        start = state.bMarks[startLine] + state.tShift[startLine]
        maximum = state.eMarks[startLine]
        if start >= len(state.src) or state.src[start] != ":":
            return False

        open_len = _fence_len(state.src, start, maximum)
        if open_len < MIN_FENCE:
            return False

        parsed = _parse_opener(state.src[start + open_len:maximum].strip())
        if not parsed or not enabled.get(parsed["structure"]):
            return False
        if silent:
            return True

        next_line = startLine
        auto_closed = False
        while True:
            next_line += 1
            if next_line >= endLine:
                break
            lstart = state.bMarks[next_line] + state.tShift[next_line]
            lmax = state.eMarks[next_line]
            if lstart >= len(state.src) or state.src[lstart] != ":":
                continue
            if state.sCount[next_line] - state.blkIndent >= 4:
                continue
            close_len = _fence_len(state.src, lstart, lmax)
            if close_len < open_len:
                continue
            p = lstart + close_len
            while p < lmax and state.src[p] in (" ", "\t"):
                p += 1
            if p < lmax:
                continue
            auto_closed = True
            break

        old_parent = state.parentType
        old_line_max = state.lineMax
        state.parentType = "chroma_container"
        state.lineMax = next_line

        if parsed["structure"] == "fields":
            rows = []
            ln = startLine + 1
            while ln < next_line:
                line = state.src[state.bMarks[ln] + state.tShift[ln]:state.eMarks[ln]]
                if line.strip():
                    ci = line.find(":")
                    if ci == -1:
                        rows.append((line.strip(), ""))
                    else:
                        rows.append((line[:ci].strip(), line[ci + 1:].strip()))
                ln += 1
            token = state.push("cm_fields", "", 0)
            token.meta = {"rows": rows}
            token.map = [startLine, next_line]
        else:
            open_token = state.push("cm_container_open", "div", 1)
            open_token.meta = parsed
            open_token.block = True
            open_token.map = [startLine, next_line]

            state.md.block.tokenize(state, startLine + 1, next_line)

            close_token = state.push("cm_container_close", "div", -1)
            close_token.meta = parsed
            close_token.block = True

        state.parentType = old_parent
        state.lineMax = old_line_max
        state.line = next_line + (1 if auto_closed else 0)
        return True

    return chroma_container


def container_plugin(md, enabled):
    md.block.ruler.before(
        "fence", "cm_container", _make_rule(enabled),
        {"alt": ["paragraph", "reference", "blockquote", "list"]},
    )

    def decorate(meta):
        custom = " cm-custom" if meta.get("color") else ""
        style = f' style="--fg:{escapeHtml(meta["color"])}"' if meta.get("color") else ""
        tone = f' data-tone="{meta["tone"]}"' if (not meta.get("color") and meta.get("tone")) else ""
        return custom, style, tone

    def render_open(self, tokens, idx, options, env):
        meta = tokens[idx].meta
        custom, style, tone = decorate(meta)
        if meta["structure"] == "details":
            open_attr = " open" if meta.get("open") else ""
            return (
                f'<details class="cm-details{custom}"{tone}{style}{open_attr}>'
                f'<summary>{escapeHtml(meta["summary"])}</summary><div class="cm-body">'
            )
        html = f'<div class="cm-block{custom}"{tone}{style}>'
        if meta.get("title"):
            html += f'<div class="cm-title">{escapeHtml(meta["title"])}</div>'
        return html + '<div class="cm-body">'

    def render_close(self, tokens, idx, options, env):
        return "</div></details>" if tokens[idx].meta["structure"] == "details" else "</div></div>"

    def render_fields(self, tokens, idx, options, env):
        # Force html:false around renderInline so field values are escaped
        # regardless of the host markdown-it configuration (defense in depth).
        prev = md.options["html"]
        md.options["html"] = False
        try:
            html = '<dl class="cm-fields">'
            for key, value in tokens[idx].meta["rows"]:
                html += f'<dt>{escapeHtml(key)}</dt><dd>{md.renderInline(value)}</dd>'
            return html + "</dl>"
        finally:
            md.options["html"] = prev

    md.add_render_rule("cm_container_open", render_open)
    md.add_render_rule("cm_container_close", render_close)
    md.add_render_rule("cm_fields", render_fields)
