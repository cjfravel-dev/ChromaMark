"""Inline ChromaMark constructs: [!pill], [.text], [=meter]."""

import re
from decimal import ROUND_HALF_UP, Decimal

from markdown_it.common.utils import escapeHtml

from .tones import parse_spec
from .whitespace import WS, WSR

SIGILS = {"!": "pill", ".": "text", "=": "meter"}

_SPLIT = re.compile(r"^([^" + WSR + r"]+)(?:[" + WSR + r"]+([\s\S]*))?$")
_PERCENT = re.compile(r"^([0-9]+(?:\.[0-9]+)?)[" + WSR + r"]*%$")
_FRACTION = re.compile(r"^([0-9]+(?:\.[0-9]+)?)[" + WSR + r"]*/[" + WSR + r"]*([0-9]+(?:\.[0-9]+)?)$")
_UNESCAPE = re.compile(r"\\([\s\S])")


def _unescape(text):
    return _UNESCAPE.sub(r"\1", text)


def _split_spec(inner):
    m = _SPLIT.match(inner)
    if not m:
        return None
    return m.group(1), (m.group(2) or "").strip(WS)


def _meter_width(value):
    percent = _PERCENT.match(value)
    fraction = _FRACTION.match(value)
    if percent:
        pct = float(percent.group(1))
    elif fraction:
        denom = float(fraction.group(2))
        if denom == 0:
            return None
        pct = float(fraction.group(1)) / denom * 100
    else:
        return None
    pct = max(0.0, min(100.0, pct))
    # Match JS String(+n.toFixed(2)): round the double half away from zero
    # (Decimal(pct) captures the exact double), then strip trailing zeros.
    quantized = Decimal(pct).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return format(quantized.normalize(), "f")


def _next_index(state, slot, needle, frm):
    """First index of `needle` at or after `frm`, memoized on the parse state so
    many openers on one long line stay O(line) overall instead of O(n^2)."""
    cache = getattr(state, slot, None)
    if cache is not None and cache[0] <= frm and (cache[1] == -1 or frm <= cache[1]):
        return cache[1]
    at = state.src.find(needle, frm)
    setattr(state, slot, (frm, at))
    return at


def _is_escaped(src, pos, floor):
    n = 0
    i = pos - 1
    while i >= floor and src[i] == "\\":
        n += 1
        i -= 1
    return n % 2 == 1


def _next_unescaped(state, slot, needle, frm, floor, max_):
    at = _next_index(state, slot, needle, frm)
    while at != -1 and at < max_ and _is_escaped(state.src, at, floor):
        at = _next_index(state, slot, needle, at + 1)
    return at


def _find_close(state, frm):
    max_ = state.posMax
    bracket = _next_unescaped(state, "_cm_br", "]", frm, frm, max_)
    if bracket == -1 or bracket >= max_:
        return -1
    newline = _next_unescaped(state, "_cm_nl", "\n", frm, frm, max_)
    if newline != -1 and newline < bracket:  # construct stays on one line
        return -1
    return bracket


def _make_rule(enabled):
    def chroma_inline(state, silent):
        start = state.pos
        src = state.src
        if start >= state.posMax or src[start] != "[":
            return False
        if start + 1 >= state.posMax:
            return False
        kind = SIGILS.get(src[start + 1])
        if not kind or not enabled.get(kind):
            return False

        end = _find_close(state, start + 2)
        if end == -1:
            return False

        inner = src[start + 2:end].strip(WS)
        parts = _split_spec(inner) if inner else None
        if not parts:
            return False
        spec_token, rest_raw = parts
        spec = parse_spec(spec_token)
        if not spec:
            return False
        rest = _unescape(rest_raw)

        if kind == "meter":
            if not rest:
                return False
            width = _meter_width(rest)
            if width is None:
                return False
            if not silent:
                tok = state.push("cm_meter", "", 0)
                tok.meta = {**spec, "value": rest, "width": width}
        elif kind == "text":
            if not rest:
                return False
            if not silent:
                tok = state.push("cm_text", "", 0)
                tok.meta = {**spec, "label": rest}
        else:
            label = rest or (spec_token.upper() if spec["tone"] else spec["color"])
            if not silent:
                tok = state.push("cm_pill", "", 0)
                tok.meta = {**spec, "label": label}

        state.pos = end + 1
        return True

    return chroma_inline


def _tone_attrs(meta):
    custom = " cm-custom" if meta.get("color") else ""
    tone = f' data-tone="{meta["tone"]}"' if meta.get("tone") else ""
    style = f' style="--fg:{escapeHtml(meta["color"])}"' if meta.get("color") else ""
    return custom, tone, style


def inline_plugin(md, enabled):
    md.inline.ruler.before("link", "cm_inline", _make_rule(enabled))

    def render_pill(self, tokens, idx, options, env):
        meta = tokens[idx].meta
        custom, tone, style = _tone_attrs(meta)
        return f'<span class="cm-pill{custom}"{tone}{style}>{escapeHtml(meta["label"])}</span>'

    def render_text(self, tokens, idx, options, env):
        meta = tokens[idx].meta
        custom, tone, style = _tone_attrs(meta)
        return f'<span class="cm-text{custom}"{tone}{style}>{escapeHtml(meta["label"])}</span>'

    def render_meter(self, tokens, idx, options, env):
        meta = tokens[idx].meta
        custom, tone, style = _tone_attrs(meta)
        aria = (
            ' role="progressbar" aria-valuemin="0" aria-valuemax="100"'
            f' aria-valuenow="{meta["width"]}" aria-valuetext="{escapeHtml(meta["value"])}"'
        )
        return (
            f'<span class="cm-meter{custom}"{tone}{style}{aria}>'
            f'<span class="cm-track"><span class="cm-fill" style="width:{meta["width"]}%"></span></span>'
            f'<span class="cm-val">{escapeHtml(meta["value"])}</span></span>'
        )

    md.add_render_rule("cm_pill", render_pill)
    md.add_render_rule("cm_text", render_text)
    md.add_render_rule("cm_meter", render_meter)
