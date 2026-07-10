from markdown_it import MarkdownIt

from chromamark import chromamark_plugin, create_renderer, get_theme, render


def test_plugin_callable():
    md = MarkdownIt("commonmark").use(chromamark_plugin)
    assert "cm-pill" in md.render("[!pass]")


def test_create_renderer():
    md = create_renderer()
    assert "cm-pill" in md.render("[!pass]")


def test_render_returns_str():
    assert isinstance(render("x"), str)


def test_gfm_tables():
    h = render("| a | b |\n| - | - |\n| 1 | 2 |")
    assert "<table>" in h
    assert "<td>1</td>" in h


def test_gfm_strikethrough():
    assert "<s>gone</s>" in render("~~gone~~")


def test_plain_commonmark():
    assert "<h1>Title</h1>" in render("# Title")
    assert "<strong>bold</strong>" in render("a **bold** word")


def test_feature_toggle_pill_off():
    md = create_renderer(pill=False)
    assert "cm-pill" not in md.render("[!pass]")
    assert "[!pass]" in md.render("[!pass]")


def test_feature_toggle_others():
    assert "cm-text" not in create_renderer(text=False).render("[.danger x]")
    assert "cm-meter" not in create_renderer(meter=False).render("[=info 50%]")
    assert "crit-add" not in create_renderer(critic=False).render("{++x++}")
    assert "cm-details" not in create_renderer(details=False).render("::: details S\nx\n:::")
    assert "cm-fields" not in create_renderer(fields=False).render("::: fields\nA: b\n:::")
    assert "cm-block" not in create_renderer(container=False).render("::: success\nx\n:::")


def test_fields_escape_on_html_true_instance():
    md = MarkdownIt("commonmark", {"html": True}).enable(["table", "strikethrough"]).use(chromamark_plugin)
    out = md.render("::: fields\nStatus: <img src=x onerror=alert(1)>\n:::")
    assert "<img" not in out
    assert "&lt;img" in out


def test_get_theme_has_tone_vars():
    css = get_theme()
    assert ".cm-block" in css
    assert "--cm-success-fg" in css
