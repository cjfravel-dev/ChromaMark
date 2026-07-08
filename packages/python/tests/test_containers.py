from chromamark import render


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
