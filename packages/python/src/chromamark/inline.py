"""Inline ChromaMark constructs: [!pill], [.text], [=meter]."""

import re
from decimal import ROUND_HALF_UP, Decimal

from markdown_it.common.utils import escapeHtml

from .tones import parse_spec

SIGILS = {"!": "pill", ".": "text", "=": "meter"}

_SPLIT = re.compile(r"^(\S+)(?:\s+([\s\S]*))?$")
_PERCENT = re.compile(r"^(\d+(?:\.\d+)?)\s*%$")
_FRACTION = re.compile(r"^(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)$")
_UNESCAPE = re.compile(r"\\([\s\S])")


def _unescape(text):
    return _UNESCAPE.sub(r"\1", text)


def _split_spec(inner):
    m = _SPLIT.match(inner)
    if not m:
        return None
    return m.group(1), (m.group(2) or "").strip()


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


def _find_close(state, frm):
    src = state.src
    i = frm
    while i < state.posMax:
        c = src[i]
        if c == "\\":
            i += 2
            continue
        if c == "\n":
            return -1
        if c == "]":
            return i
        i += 1
    return -1


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

        inner = src[start + 2:end].strip()
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
        return (
            f'<span class="cm-meter{custom}"{tone}{style}>'
            f'<span class="cm-track"><span class="cm-fill" style="width:{meta["width"]}%"></span></span>'
            f'<span class="cm-val">{escapeHtml(meta["value"])}</span></span>'
        )

    md.add_render_rule("cm_pill", render_pill)
    md.add_render_rule("cm_text", render_text)
    md.add_render_rule("cm_meter", render_meter)
