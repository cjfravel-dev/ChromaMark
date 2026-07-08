"""Parity with the JS renderer on cases the review flagged as divergent."""

from chromamark import render


def inline(s):
    return render(s).replace("<p>", "").replace("</p>", "").strip()


def test_linkify_bare_url():
    # JS builds markdown-it with linkify:true, so bare URLs auto-link.
    assert '<a href="https://example.com">https://example.com</a>' in render("Visit https://example.com now")


def test_linkify_email():
    assert '<a href="mailto:test@example.com">test@example.com</a>' in render("Email test@example.com please")


def test_meter_rounding_matches_js_half_up():
    # JS uses toFixed(2) on the double value; match it exactly, including
    # non-exactly-representable decimals (49.995 -> 49.99, not 50).
    assert 'style="width:3.13%"' in inline("[=info 1/32]")
    assert 'style="width:0.63%"' in inline("[=info 1/160]")
    assert 'style="width:0.13%"' in inline("[=info 0.125%]")
    assert 'style="width:2.13%"' in inline("[=info 2.125%]")
    assert 'style="width:49.99%"' in inline("[=info 49.995%]")
    assert 'style="width:2.67%"' in inline("[=info 2.675%]")
    assert 'style="width:1%"' in inline("[=info 1.005%]")


def test_meter_common_values_unchanged():
    assert 'style="width:87%"' in inline("[=success 87%]")
    assert 'style="width:30%"' in inline("[=info 3/10]")
    assert 'style="width:100%"' in inline("[=success 100%]")
    assert 'style="width:0%"' in inline("[=info 0%]")


def test_meter_rejects_unicode_digits_like_js():
    # JS `\d` matches only ASCII [0-9]; Python `\d` also matches Unicode digits
    # (e.g. Devanagari). The meter must decline non-ASCII digits to stay
    # byte-identical to JS, which leaves the text literal.
    assert "cm-meter" not in render("[=success १%]")
    assert "cm-meter" not in render("[=info १/१०]")
    assert "cm-meter" not in render("[=success ٥%]")
