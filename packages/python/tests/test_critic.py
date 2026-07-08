from chromamark import render


def inline(s):
    return render(s).replace("<p>", "").replace("</p>", "").strip()


def test_add():
    assert '<ins class="crit-add">added</ins>' in inline("{++added++}")


def test_del():
    assert '<del class="crit-del">removed</del>' in inline("{--removed--}")


def test_sub():
    assert (
        '<del class="crit-del">flights</del><ins class="crit-add">query_parameters</ins>'
        in inline("{~~flights~>query_parameters~~}")
    )


def test_mark():
    assert '<mark class="crit-mark">review this</mark>' in inline("{==review this==}")


def test_comment():
    assert '<span class="crit-comment">a note</span>' in inline("{>>a note<<}")


def test_escapes_html():
    assert "&lt;b&gt;" in inline("{++<b>x</b>++}")


def test_lone_brace_untouched():
    assert "use { and } freely" in inline("use { and } freely")
