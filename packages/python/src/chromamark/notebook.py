"""Jupyter / notebook display helpers for ChromaMark."""


class ChromaMarkHTML:
    """Wraps rendered ChromaMark HTML so notebooks display it via ``_repr_html_``."""

    def __init__(self, html):
        self._html = html

    def _repr_html_(self):
        return self._html

    def __str__(self):
        return self._html


def _wrap(src, options):
    from . import render, get_theme
    body = render(src, **options)
    return f'<style>{get_theme()}</style>\n<div class="chromamark-output">{body}</div>'


def display_chromamark(src, **options):
    """Render ChromaMark and display it inline in a notebook.

    In an IPython/Jupyter session this calls ``IPython.display.display``; outside
    one it returns a :class:`ChromaMarkHTML` (which itself renders via
    ``_repr_html_``).
    """
    html = _wrap(src, options)
    try:
        from IPython import get_ipython
        from IPython.display import HTML, display

        if get_ipython() is not None:
            display(HTML(html))
            return None
    except Exception:
        pass
    return ChromaMarkHTML(html)
