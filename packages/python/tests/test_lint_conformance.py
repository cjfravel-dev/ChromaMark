import json
from pathlib import Path

from chromamark import LANGUAGE_VERSION, lint

CORPUS = Path(__file__).parents[3] / "conformance" / "lint-cases.json"


def test_python_linter_matches_shared_diagnostic_corpus():
    corpus = json.loads(CORPUS.read_text(encoding="utf-8"))
    assert corpus["version"] == 1
    assert corpus["languageVersion"] == LANGUAGE_VERSION
    for fixture in corpus["cases"]:
        assert lint(fixture["source"], disable=fixture.get("disable")) == fixture["diagnostics"], fixture["name"]
