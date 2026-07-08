"""ChromaDoc — a fluent builder that emits ChromaMark source (and renders it)."""

import re

_FENCE_RUN = re.compile(r"(?m)^\s*(:{3,})")


def _line(text):
    """Collapse newlines so a value stays within its single-line context
    (titles, summaries, field keys/values) instead of injecting new lines."""
    return str(text).replace("\r\n", " ").replace("\r", " ").replace("\n", " ")


def _inline_label(text):
    """Escape a value used as an inline-construct label so a ``]`` can't
    truncate the construct (and a stray backslash can't mis-escape); newlines
    are collapsed."""
    return _line(text).replace("\\", "\\\\").replace("]", "\\]")


def _cell(text):
    """Escape a table cell so a ``|`` can't break the column layout."""
    return _line(text).replace("\\", "\\\\").replace("|", "\\|")


class ChromaDoc:
    """Assemble a ChromaMark document programmatically.

    Every method returns ``self`` for chaining. Use :meth:`to_cm` for the
    ChromaMark source, :meth:`to_html` to render, and it renders inline in
    Jupyter via ``_repr_html_``.
    """

    def __init__(self):
        self._blocks = []

    # ---- inline helpers (return strings) ----
    def pill(self, tone, label=None):
        return f"[!{tone}]" if label is None else f"[!{tone} {_inline_label(label)}]"

    def tint(self, tone, label):
        return f"[.{tone} {_inline_label(label)}]"

    def meter(self, tone, value):
        return f"[={tone} {_inline_label(value)}]"

    # ---- block builders (append, return self) ----
    def _add(self, chunk):
        self._blocks.append(chunk)
        return self

    def raw(self, markdown_text):
        return self._add(str(markdown_text))

    def heading(self, text, level=2):
        return self._add(f"{'#' * max(1, min(6, level))} {text}")

    def paragraph(self, text):
        return self._add(str(text))

    def _body_to_cm(self, body):
        if body is None:
            return ""
        if isinstance(body, ChromaDoc):
            return body.to_cm().rstrip("\n")
        return str(body)

    def _fence_for(self, body_cm):
        longest = 0
        for match in _FENCE_RUN.finditer(body_cm or ""):
            longest = max(longest, len(match.group(1)))
        return ":" * max(3, longest + 1)

    def _container(self, opener, body):
        body_cm = self._body_to_cm(body)
        fence = self._fence_for(body_cm) if body_cm else ":::"
        head = f"{fence} {opener}"
        if body_cm:
            return f"{head}\n{body_cm}\n{fence}"
        return f"{head}\n{fence}"

    def block(self, tone, title=None, body=None):
        opener = tone if not title else f"{tone} {_line(title)}"
        return self._add(self._container(opener, body))

    def success(self, title=None, body=None):
        return self.block("success", title, body)

    def info(self, title=None, body=None):
        return self.block("info", title, body)

    def tip(self, title=None, body=None):
        return self.block("tip", title, body)

    def warning(self, title=None, body=None):
        return self.block("warning", title, body)

    def danger(self, title=None, body=None):
        return self.block("danger", title, body)

    def muted(self, title=None, body=None):
        return self.block("muted", title, body)

    def details(self, summary, body=None, open=False, tone=None):
        parts = ["details"]
        if open:
            parts.append("open")
        if tone:
            parts.append(tone)
        parts.append(_line(summary))
        return self._add(self._container(" ".join(parts), body))

    def fields(self, _map=None, **kwargs):
        rows = {}
        if _map:
            rows.update(_map)
        rows.update(kwargs)
        lines = "\n".join(f"{_line(k)}: {_line(v)}" for k, v in rows.items())
        fence = self._fence_for(lines)
        return self._add(f"{fence} fields\n{lines}\n{fence}")

    def table(self, headers, rows):
        head = "| " + " | ".join(_cell(h) for h in headers) + " |"
        sep = "| " + " | ".join("---" for _ in headers) + " |"
        body = "\n".join("| " + " | ".join(_cell(c) for c in row) + " |" for row in rows)
        return self._add("\n".join([head, sep, body]))

    # ---- output ----
    def to_cm(self):
        return "\n\n".join(self._blocks) + "\n"

    def to_html(self, **options):
        from . import render
        return render(self.to_cm(), **options)

    def _repr_html_(self):
        from . import get_theme
        return f'<style>{get_theme()}</style>\n<div class="chromamark-output">{self.to_html()}</div>'
