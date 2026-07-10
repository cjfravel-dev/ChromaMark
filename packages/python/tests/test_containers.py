from markdown_it import MarkdownIt

from chromamark import render
from chromamark.plugin import chromamark_plugin


def _html_true():
    md = MarkdownIt("js-default", {"html": True, "linkify": True}).enable("linkify")
    md.use(chromamark_plugin)
    return md


def test_bare_tone_block():
    h = render("::: success\nAll 247 tests passed.\n:::")
    assert '<div class="cm-block" data-tone="success">' in h
    assert '<div class="cm-title">Success</div>' in h
    assert "<p>All 247 tests passed.</p>" in h


def test_title_override_and_markdown_body():
    h = render("::: warning Deprecation\nUse `query_parameters` instead.\n:::")
    assert 'data-tone="warning"' in h
    assert '<div class="cm-title">Deprecation</div>' in h
    assert "<code>query_parameters</code>" in h


def test_alias_kind():
    h = render("::: fail Boom\nnope\n:::")
    assert 'data-tone="danger"' in h
    assert '<div class="cm-title">Boom</div>' in h


def test_block_custom_color():
    h = render("::: block color=#6f42c1 Custom hue\nhi\n:::")
    assert 'class="cm-block cm-custom"' in h
    assert 'style="--fg:#6f42c1"' in h
    assert '<div class="cm-title">Custom hue</div>' in h


def test_block_no_title():
    h = render("::: block color=#0f7b6c\nbody\n:::")
    assert "cm-title" not in h
    assert "<p>body</p>" in h


def test_details_collapsed():
    h = render("::: details Stack trace\nline one\n:::")
    assert '<details class="cm-details">' in h
    assert "<summary>Stack trace</summary>" in h
    assert "<p>line one</p>" in h


def test_details_open_tone():
    h = render("::: details open warning 12 lint warnings\n- a\n- b\n:::")
    assert '<details class="cm-details" data-tone="warning" open>' in h
    assert "<summary>12 lint warnings</summary>" in h
    assert "<li>a</li>" in h


def test_fields():
    h = render("::: fields\nRegion: eastus\nStatus: [!ok healthy]\n:::")
    assert '<dl class="cm-fields">' in h
    assert "<dt>Region</dt><dd>eastus</dd>" in h
    assert '<dt>Status</dt><dd><span class="cm-pill" data-tone="success">healthy</span></dd>' in h


def test_nesting_more_colons_outside():
    src = "\n".join([
        ":::: danger Release blocked",
        "Two gates failed:",
        "",
        "::: details Gate 1",
        "FAILED test_a",
        ":::",
        "::::",
    ])
    h = render(src)
    assert '<div class="cm-block" data-tone="danger">' in h
    assert '<details class="cm-details">' in h
    assert "<summary>Gate 1</summary>" in h


def test_unknown_kind_literal():
    h = render("::: bogus\nhi\n:::")
    assert "::: bogus" in h
    assert "cm-block" not in h


def test_unclosed_container_to_eof():
    h = render("::: success\nno closing fence")
    assert '<div class="cm-block" data-tone="success">' in h
    assert "no closing fence" in h


def test_render_fields_does_not_mutate_shared_options():
    from chromamark import create_renderer

    md = create_renderer()
    writes = []

    class Guard(type(md.options)):
        def __setitem__(self, key, value):
            writes.append(key)
            super().__setitem__(key, value)

    md.options = Guard(md.options)
    md.render("::: fields\nKey: <b>x</b>\n:::")
    assert "html" not in writes, f"render_fields mutated shared options: {writes}"


def test_fields_preserve_html_when_host_enables_html():
    md = MarkdownIt("js-default", {"html": True, "linkify": True}).use(chromamark_plugin)
    out = md.render("::: fields\nStatus: <kbd>ready</kbd>\nBold: **hi** [!ok pass]\n:::")
    assert "<dd><kbd>ready</kbd></dd>" in out
    assert "<strong>hi</strong>" in out
    assert 'class="cm-pill"' in out


def test_title_renders_inline_pills():
    h = render("::: success Deploy [!ok healthy]\nbody\n:::")
    assert '<div class="cm-title">Deploy <span class="cm-pill" data-tone="success">healthy</span></div>' in h


def test_summary_renders_inline_pills():
    h = render("::: details Failures [!fail 3]\nx\n:::")
    assert '<summary>Failures <span class="cm-pill" data-tone="danger">3</span></summary>' in h


def test_title_renders_markdown_inline():
    h = render("::: info **Bold** and `code`\nx\n:::")
    assert '<div class="cm-title"><strong>Bold</strong> and <code>code</code></div>' in h


def test_title_escapes_raw_html():
    h = render("::: warning <img src=x onerror=alert(1)> danger\nx\n:::")
    assert "<img" not in h
    assert "&lt;img" in h


def test_plain_title_unchanged():
    h = render("::: success Deploy succeeded in 3m12s\nx\n:::")
    assert '<div class="cm-title">Deploy succeeded in 3m12s</div>' in h


def test_code_fence_inside_container_not_closed_early():
    h = render("::: success\n```\n:::\n```\n:::")
    assert '<div class="cm-body"><pre><code>:::\n</code></pre>' in h
    assert "</div></div>\n<pre>" not in h


def test_chromamark_example_in_code_fence_stays_in_container():
    h = render("::: info Example\n```\n::: success\nhi\n:::\n```\n:::")
    assert 'data-tone="info"' in h
    assert 'data-tone="success"' not in h
    assert "<pre><code>::: success\nhi\n:::\n</code></pre>" in h


def test_tilde_fence_inside_container_is_fence_aware():
    h = render("::: success\n~~~\n:::\n~~~\n:::")
    assert '<div class="cm-body"><pre><code>:::\n</code></pre>' in h
    assert "</div></div>\n<pre>" not in h


def test_container_body_preserves_raw_block_html_on_html_true_host():
    h = _html_true().render("::: success\n<img src=x onerror=alert(1)>\n:::")
    assert "<img src=x onerror=alert(1)>" in h


def test_container_body_preserves_inline_html_on_html_true_host():
    h = _html_true().render("::: info\ntext <b>bold</b> more\n:::")
    assert "<b>bold</b>" in h


def test_details_body_preserves_raw_html_on_html_true_host():
    h = _html_true().render("::: details Summary\n<script>alert(1)</script>\n:::")
    assert "<script>alert(1)</script>" in h


def test_html_passes_through_consistently_on_html_true_host():
    h = _html_true().render("<div>outside</div>\n\n::: success\n<b>in</b>\n:::")
    assert "<div>outside</div>" in h
    assert "<b>in</b>" in h


def test_titles_and_summaries_preserve_inline_html_on_html_true_host():
    block = _html_true().render("::: info Press <kbd>Enter</kbd>\nbody\n:::")
    details = _html_true().render("::: details See <em>more</em>\nbody\n:::")
    assert '<div class="cm-title">Press <kbd>Enter</kbd></div>' in block
    assert "<summary>See <em>more</em></summary>" in details


def test_ws_bom_separates_container_kind_from_title():
    h = render("::: success\ufeffDeploy\nbody\n:::")
    assert 'data-tone="success"' in h
    assert '<div class="cm-title">Deploy</div>' in h
