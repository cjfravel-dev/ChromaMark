"""Collapsible table row groups for markdown-it-py."""

import re
from typing import Optional, TypedDict

from markdown_it.token import Token

_MARKER_RUN = re.compile(r"^(?:[\u21b3>][ \t]*)+")


class ParsedMarkers(TypedDict):
    depth: int
    rest: str


def parse_row_markers(text: object) -> Optional[ParsedMarkers]:
    """Count a leading table row marker run, or return ``None``."""
    source = "" if text is None else str(text)
    match = _MARKER_RUN.match(source)
    if not match:
        return None
    run = match.group(0)
    return {
        "depth": len(re.findall(r"[\u21b3>]", run)),
        "rest": source[len(run):],
    }


def row_group_plugin(md):
    """Install the table row group core rule and toggle renderer."""

    def annotate(state, tokens, rows, parsed):
        depths = []
        previous = -1
        for row_index, entry in enumerate(parsed):
            raw = entry["depth"] if entry else 0
            depth = 0 if previous < 0 else min(raw, previous + 1)
            depths.append(depth)
            previous = depth
            if entry and entry["depth"] > 0 and rows[row_index]["inline"] != -1:
                tokens[rows[row_index]["inline"]].content = entry["rest"]

        for row_index in range(len(rows) - 1, -1, -1):
            depth = depths[row_index]
            is_parent = row_index + 1 < len(rows) and depths[row_index + 1] > depth
            classes = ["cm-row"]
            if is_parent:
                classes.append("cm-row-parent")
            if depth > 0:
                classes.append("cm-row-child")

            tr = tokens[rows[row_index]["tr"]]
            tr.attrSet("class", " ".join(classes))
            tr.attrSet("data-cm-depth", str(depth))

            if is_parent and rows[row_index]["inline"] != -1:
                toggle = Token("cm_row_toggle", "", 0)
                toggle.hidden = True
                tokens.insert(rows[row_index]["inline"], toggle)

    def cm_rowgroups(state):
        tokens = state.tokens
        rows = []
        in_body = False

        def flush():
            nonlocal rows
            parsed = [
                None if row["inline"] == -1 else parse_row_markers(tokens[row["inline"]].content)
                for row in rows
            ]
            if any(entry and entry["depth"] > 0 for entry in parsed):
                annotate(state, tokens, rows, parsed)
            rows = []

        index = 0
        while index < len(tokens):
            token_type = tokens[index].type
            if token_type == "tbody_open":
                in_body = True
            elif token_type == "tbody_close":
                in_body = False
                flush()
            elif token_type == "tr_open" and in_body:
                inline = -1
                cursor = index + 1
                while cursor < len(tokens) and tokens[cursor].type != "tr_close":
                    if tokens[cursor].type == "inline":
                        inline = cursor
                        break
                    cursor += 1
                rows.append({"tr": index, "inline": inline})
            index += 1
        flush()
        return True

    def render_toggle(tokens, idx, options, env):
        return (
            '<button class="cm-row-toggle" type="button" aria-expanded="true"'
            ' aria-label="Toggle nested rows"></button>'
        )

    md.core.ruler.after("block", "cm_rowgroups", cm_rowgroups)
    md.renderer.rules["cm_row_toggle"] = render_toggle
    return md
