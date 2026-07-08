from chromamark import ChromaMarkHTML, display_chromamark


def test_display_returns_html_object_without_ipython():
    obj = display_chromamark("::: success\nok [!pass]\n:::")
    # No IPython kernel during tests -> returns a ChromaMarkHTML wrapper.
    assert isinstance(obj, ChromaMarkHTML)
    html = obj._repr_html_()
    assert "cm-block" in html
    assert "cm-pill" in html
    assert "<style" in html


def test_chromamarkhtml_repr():
    obj = ChromaMarkHTML("<b>x</b>")
    assert obj._repr_html_() == "<b>x</b>"
    assert str(obj) == "<b>x</b>"
