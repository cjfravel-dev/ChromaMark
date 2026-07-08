"""The ChromaMark color vocabulary: semantic tones plus a hex/name escape hatch."""

import re

TONES = ["success", "danger", "warning", "info", "tip", "muted"]

ALIASES = {
    "ok": "success",
    "pass": "success",
    "error": "danger",
    "fail": "danger",
    "warn": "warning",
    "note": "info",
    "hint": "tip",
    "skip": "muted",
}

_HEX = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\Z")
_COLOR_NAME = re.compile(r"^[a-zA-Z][a-zA-Z0-9]*\Z")


def resolve_tone(name):
    """Resolve a token to a canonical tone, or None. Case-insensitive."""
    if not isinstance(name, str):
        return None
    key = name.lower()
    if key in TONES:
        return key
    return ALIASES.get(key)


def is_hex(value):
    return isinstance(value, str) and bool(_HEX.match(value))


def is_safe_color(value):
    """True for a hex literal or a plain CSS color name (safe in a style attr)."""
    return is_hex(value) or (isinstance(value, str) and bool(_COLOR_NAME.match(value)))


def parse_spec(token):
    """Parse a leading spec token into {'tone', 'color'} or None if unrecognized."""
    if not isinstance(token, str) or token == "":
        return None
    if token.lower().startswith("color="):
        value = token[len("color="):]
        if not is_safe_color(value):
            return None
        return {"tone": None, "color": value}
    if is_hex(token):
        return {"tone": None, "color": token}
    tone = resolve_tone(token)
    if tone:
        return {"tone": tone, "color": None}
    return None
