"""ChromaMark for Python — renderer, builder, and Jupyter display.

Produces the same HTML as the JavaScript ``@chromamark/renderer`` so the same
theme applies. Built on markdown-it-py.
"""

import importlib.resources as _resources

from markdown_it import MarkdownIt

from .builder import ChromaDoc
from .lint import LintDiagnostic, lint
from .notebook import ChromaMarkHTML, display_chromamark
from .plugin import chromamark_plugin
from .tones import TONES, is_safe_color, parse_spec, resolve_tone

__version__ = "0.1.4"
LANGUAGE_VERSION = "0.1"


def create_renderer(**options):
    """Return a markdown-it-py instance configured for ChromaMark (CommonMark + GFM)."""
    highlight = options.pop("highlight", None)
    md = MarkdownIt(
        "js-default",
        {"html": False, "linkify": True, "highlight": highlight},
    ).enable("linkify")
    md.use(chromamark_plugin, **options)
    return md


def render(src, **options):
    """Render a ChromaMark string to an HTML fragment."""
    return create_renderer(**options).render("" if src is None else str(src))


def get_theme():
    """Return the ChromaMark theme stylesheet as a string."""
    return (_resources.files("chromamark") / "theme.css").read_text(encoding="utf-8")


__all__ = [
    "render",
    "create_renderer",
    "chromamark_plugin",
    "get_theme",
    "ChromaDoc",
    "lint",
    "LintDiagnostic",
    "display_chromamark",
    "ChromaMarkHTML",
    "resolve_tone",
    "parse_spec",
    "is_safe_color",
    "TONES",
    "LANGUAGE_VERSION",
    "__version__",
]
