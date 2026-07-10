from chromamark.tones import TONES, is_safe_color, parse_spec, resolve_tone


def test_canonical_tones():
    for t in TONES:
        assert resolve_tone(t) == t


def test_aliases():
    assert resolve_tone("ok") == "success"
    assert resolve_tone("pass") == "success"
    assert resolve_tone("error") == "danger"
    assert resolve_tone("fail") == "danger"
    assert resolve_tone("warn") == "warning"
    assert resolve_tone("note") == "info"
    assert resolve_tone("hint") == "tip"
    assert resolve_tone("skip") == "muted"


def test_case_insensitive():
    assert resolve_tone("PASS") == "success"
    assert resolve_tone("Warning") == "warning"


def test_unknown():
    assert resolve_tone("bogus") is None
    assert resolve_tone("") is None
    assert resolve_tone(None) is None


def test_parse_spec():
    assert parse_spec("success") == {"tone": "success", "color": None}
    assert parse_spec("ok") == {"tone": "success", "color": None}
    assert parse_spec("color=#6f42c1") == {"tone": None, "color": "#6f42c1"}
    assert parse_spec("#6f42c1") == {"tone": None, "color": "#6f42c1"}
    assert parse_spec("color=purple") == {"tone": None, "color": "purple"}
    assert parse_spec("nope") is None
    assert parse_spec("color=red;x") is None


def test_is_safe_color():
    assert is_safe_color("#6f42c1")
    assert is_safe_color("#0a0")
    assert is_safe_color("rebeccapurple")
    assert not is_safe_color("#12")
    assert not is_safe_color("red;x")
    assert not is_safe_color("#ggg")


def test_is_safe_color_rejects_trailing_newline():
    # Python's `$` matches before a trailing newline while JS's `$` does not;
    # the guard must anchor to the absolute end so it matches JS isSafeColor.
    assert not is_safe_color("red\n")
    assert not is_safe_color("#fff\n")
    assert not is_safe_color("#6f42c1\n")
    assert parse_spec("color=red\n") is None
