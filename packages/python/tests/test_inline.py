from chromamark import render


def inline(s):
    return render(s).replace("<p>", "").replace("</p>", "").strip()


def test_pill_with_label():
    assert inline("[!success PASS]") == '<span class="cm-pill" data-tone="success">PASS</span>'


def test_pill_default_label():
    assert '<span class="cm-pill" data-tone="success">PASS</span>' in inline("[!pass]")
    assert '<span class="cm-pill" data-tone="muted">SKIP</span>' in inline("[!skip]")


def test_pill_spaces():
    assert '<span class="cm-pill" data-tone="danger">3 of 88</span>' in inline("[!fail 3 of 88]")


def test_pill_custom_color():
    assert '<span class="cm-pill cm-custom" style="--fg:#6f42c1">beta</span>' in inline("[!color=#6f42c1 beta]")
    assert '<span class="cm-pill cm-custom" style="--fg:#6f42c1">beta</span>' in inline("[!#6f42c1 beta]")


def test_colored_text():
    assert inline("[.danger critical]") == '<span class="cm-text" data-tone="danger">critical</span>'


def test_meter_percent():
    h = inline("[=success 87%]")
    assert '<span class="cm-meter" data-tone="success">' in h
    assert '<span class="cm-fill" style="width:87%"></span>' in h
    assert '<span class="cm-val">87%</span>' in h


def test_meter_fraction():
    assert 'style="width:30%"' in inline("[=info 3/10]")


def test_meter_div_zero_literal():
    assert "cm-meter" not in render("[=success 0/0]")


def test_meter_clamp():
    assert 'style="width:100%"' in inline("[=success 150%]")


def test_pills_in_table():
    src = "| Suite | Result |\n| - | - |\n| unit | [!pass] |"
    assert '<td><span class="cm-pill" data-tone="success">PASS</span></td>' in render(src)


def test_unknown_pill_literal():
    out = render("status [!nope broken]")
    assert "[!nope broken]" in out
    assert "cm-pill" not in out


def test_escaped_opener_literal():
    assert "cm-pill" not in render("literal \\[!success x]")


def test_html_escaped_in_label():
    assert "&lt;b&gt;" in inline("[!info <b>x</b>]")


def test_ws_nel_u0085_is_not_a_pill_separator():
    # U+0085 (NEL) is NOT ChromaMark whitespace (mirrors JS \s), so it does not
    # split the spec from the label; the construct stays literal.
    assert "cm-pill" not in render("[!success\u0085pass]")


def test_ws_fs_u001c_is_not_a_pill_separator():
    assert "cm-pill" not in render("[!success\u001cpass]")


def test_ws_bom_ufeff_separates_pill_spec_from_label():
    # U+FEFF (BOM/ZWNBSP) IS ChromaMark whitespace (mirrors JS \s).
    assert '<span class="cm-pill" data-tone="success">pass</span>' in render("[!success\ufeffpass]")


def test_ws_nbsp_still_separates_pill():
    # NBSP (U+00A0) is whitespace in both — regression guard.
    assert '<span class="cm-pill" data-tone="success">pass</span>' in render("[!success\u00a0pass]")
