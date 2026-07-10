import json
from pathlib import Path

from chromamark import render


CORPUS = Path(__file__).parents[3] / "conformance" / "cases.json"


def test_shared_conformance_corpus_renders_expected_html_in_python():
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    assert corpus["version"] == 1
    assert corpus["cases"], "the corpus must contain conformance cases"

    for fixture in corpus["cases"]:
        actual = render(fixture["source"], **fixture.get("options", {}))
        assert actual == fixture["html"], fixture["name"]
