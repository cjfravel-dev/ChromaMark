"""Diagnostics for malformed ChromaMark constructs that otherwise degrade silently."""

import re
from typing import Iterable, List, Optional, TypedDict

from .tones import parse_spec, resolve_tone
from .whitespace import WSR
from .whitespace import split as ws_split
from .whitespace import strip as ws_strip


class LintDiagnostic(TypedDict):
    line: int
    column: int
    severity: str
    rule: str
    message: str


_BLOCK_KINDS = {"details", "fields", "block"}
_HEX = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\Z")
_CODE_SPAN = re.compile(r"(`+)(.+?)\1")
_INLINE = re.compile(r"\[([!.=])([^" + WSR + r"\]]+)(?:[" + WSR + r"]+([^\]]*))?\]")
_CONSTRUCT_IN_CODE = re.compile(r"\[[!.=]|\{(?:\+\+|--|~~|==|>>)")
_FENCE_CODE = re.compile(r"^ {0,3}(`{3,}|~{3,})")
_FENCE_CODE_CLOSE = re.compile(r"^ {0,3}(`{3,}|~{3,})[" + WSR + r"]*\Z")
_CONTAINER = re.compile(r"^( {0,3})(:{3,})(.*)\Z")
_PERCENT = re.compile(r"^[0-9]+(?:\.[0-9]+)?[" + WSR + r"]*%\Z")
_FRACTION = re.compile(
    r"^([0-9]+(?:\.[0-9]+)?)[" + WSR + r"]*/[" + WSR + r"]*([0-9]+(?:\.[0-9]+)?)\Z"
)


def _is_block_kind(kind: str) -> bool:
    return kind in _BLOCK_KINDS or resolve_tone(kind) is not None or kind.startswith("color=") or bool(_HEX.match(kind))


def _meter_value_valid(value: Optional[str]) -> bool:
    normalized = "" if value is None else ws_strip(value)
    if _PERCENT.match(normalized):
        return True
    fraction = _FRACTION.match(normalized)
    return fraction is not None and float(fraction.group(2)) != 0


def _is_escaped(line: str, index: int) -> bool:
    count = 0
    cursor = index - 1
    while cursor >= 0 and line[cursor] == "\\":
        count += 1
        cursor -= 1
    return count % 2 == 1


def _scan_inline(line: str, row: int, diagnostics: List[LintDiagnostic]) -> None:
    spans = [(match.start(), match.end(), match.group(2)) for match in _CODE_SPAN.finditer(line)]
    for start, _end, inner in spans:
        if _CONSTRUCT_IN_CODE.search(inner):
            diagnostics.append({
                "line": row,
                "column": start + 1,
                "severity": "warning",
                "rule": "CM001",
                "message": "ChromaMark construct is inside backticks; it renders as code, not rich output",
            })

    for match in _INLINE.finditer(line):
        index = match.start()
        if any(start <= index < end for start, end, _inner in spans) or _is_escaped(line, index):
            continue
        after_index = match.end()
        if after_index < len(line) and line[after_index] in "([":
            continue
        sigil, spec_token, label = match.groups()
        spec = parse_spec(spec_token)
        if spec is None:
            what = "pill" if sigil == "!" else "colored text" if sigil == "." else "meter"
            diagnostics.append({
                "line": row,
                "column": index + 1,
                "severity": "warning",
                "rule": "CM002",
                "message": (
                    f'unknown tone/color "{spec_token}"; this looks like a {what} '
                    "but renders as literal text"
                ),
            })
        elif sigil == "=" and not _meter_value_valid(label):
            message = (
                f'meter value "{label}" is not NN% or A/B'
                if label
                else "meter is missing a value (NN% or A/B)"
            )
            diagnostics.append({
                "line": row,
                "column": index + 1,
                "severity": "warning",
                "rule": "CM004",
                "message": message,
            })


def lint(source: object, disable: Optional[Iterable[str]] = None) -> List[LintDiagnostic]:
    """Return CM001-CM005 diagnostics with one-based line and column positions."""
    disabled = set(disable or ())
    lines = str("" if source is None else source).split("\n")
    diagnostics: List[LintDiagnostic] = []
    open_stack = []
    in_code = False
    fence_character = ""
    fence_length = 0

    for index, line in enumerate(lines):
        row = index + 1
        if in_code:
            close = _FENCE_CODE_CLOSE.match(line)
            if close and close.group(1)[0] == fence_character and len(close.group(1)) >= fence_length:
                in_code = False
            continue

        code_open = _FENCE_CODE.match(line)
        if code_open:
            in_code = True
            fence_character = code_open.group(1)[0]
            fence_length = len(code_open.group(1))
            continue

        container = _CONTAINER.match(line)
        if container:
            colons = len(container.group(2))
            info = ws_strip(container.group(3))
            if info == "":
                for stack_index in range(len(open_stack) - 1, -1, -1):
                    if colons >= open_stack[stack_index]["colons"]:
                        del open_stack[stack_index]
                        break
                continue

            kind = ws_split(info)[0]
            if not _is_block_kind(kind.lower()):
                diagnostics.append({
                    "line": row,
                    "column": len(container.group(1)) + colons + 1,
                    "severity": "warning",
                    "rule": "CM003",
                    "message": f'unknown block kind "{kind}"; this ":::" fence renders as literal text',
                })
            else:
                open_stack.append({"line": row, "colons": colons, "kind": kind})

        _scan_inline(line, row, diagnostics)

    for opened in open_stack:
        diagnostics.append({
            "line": opened["line"],
            "column": 1,
            "severity": "warning",
            "rule": "CM005",
            "message": (
                f'container "{opened["kind"]}" is opened here but never closed '
                "(auto-closes at end of input)"
            ),
        })

    return sorted(
        (diagnostic for diagnostic in diagnostics if diagnostic["rule"] not in disabled),
        key=lambda diagnostic: (diagnostic["line"], diagnostic["column"]),
    )
