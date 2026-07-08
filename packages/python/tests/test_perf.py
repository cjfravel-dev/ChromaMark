"""Parsing stays linear on adversarial unclosed/unterminated constructs.

The unclosed-inline case previously ran a Python char loop that rescanned the
line tail for every opener (O(n^2)); a generous absolute bound still fails on the
quadratic code while being robust to CI speed. The CriticMarkup counterpart uses
str.find (C level), so its quadratic constant is too small for a stable wall-clock
bound here — its linear scan is covered by the JS perf suite and the tests below
guard correctness in both languages.
"""

import time

from chromamark import render


def _ms(fn):
    start = time.perf_counter()
    fn()
    return (time.perf_counter() - start) * 1000


def test_unclosed_inline_openers_are_linear():
    src = "[!success " * 4000
    assert _ms(lambda: render(src)) < 2000


def test_unclosed_inline_stays_literal():
    assert "[!success no close" in render("[!success no close")


def test_inline_does_not_span_newline():
    assert "cm-pill" not in render("[!success a\nb]")


def test_unterminated_critic_stays_literal():
    assert "crit-add" not in render("{++ unterminated")
    assert "<ins" not in render("{++ unterminated")


def test_terminated_critic_still_renders():
    assert "crit-add" in render("{++added++}")
    assert "crit-del" in render("{--removed--}")
