"""Canonical ChromaMark whitespace set.

Mirrors the ECMAScript ``\\s`` set that the JavaScript renderer splits sigils and
container openers on, so both renderers agree on which code points count as
whitespace. Notably this set includes U+FEFF and excludes U+0085 and
U+001C-U+001F, unlike Python's native ``str.strip``/``str.split``/regex ``\\s``.
"""

import re

# The actual whitespace characters, for ``str.strip(WS)``.
WS = (
    "\t\n\x0b\x0c\r \xa0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007"
    "\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"
)

# The same set as a regex character-class body (with ranges), for use inside
# ``[...]`` / ``[^...]``.
WSR = "\\t\\n\\x0b\\x0c\\r \\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff"

_SPLIT_RE = re.compile("[" + WSR + "]+")


def strip(text):
    """Strip leading/trailing canonical whitespace (like JS ``String.trim``)."""
    return text.strip(WS)


def split(text):
    """Split on runs of canonical whitespace (like JS ``str.split(/\\s+/)``).

    Empty leading/trailing fields are dropped so a trimmed opener tokenizes the
    same way in both renderers.
    """
    return [t for t in _SPLIT_RE.split(text) if t != ""]
