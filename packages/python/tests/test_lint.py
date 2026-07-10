from chromamark import lint


def rules(source, **options):
    return sorted(diagnostic["rule"] for diagnostic in lint(source, **options))


def test_well_formed_document_has_no_diagnostics():
    source = "::: success Deploy [!ok healthy]\nAll [!pass] and [=info 87%] and [.danger x]\n:::\n"
    assert lint(source) == []


def test_lint_reports_all_five_rules_with_js_compatible_shapes():
    source = "\n".join([
        "See `[!pass]`.",
        "Build [!succes 3]",
        "[=info 3/0]",
        "::: nope Title",
        "::: success Open",
    ])
    diagnostics = lint(source)
    assert [diagnostic["rule"] for diagnostic in diagnostics] == [
        "CM001", "CM002", "CM004", "CM003", "CM005",
    ]
    for diagnostic in diagnostics:
        assert diagnostic["line"] >= 1
        assert diagnostic["column"] >= 1
        assert diagnostic["severity"] == "warning"
        assert diagnostic["message"]


def test_lint_matches_inline_and_container_edge_cases():
    assert rules("Use `{~~old~>new~~}` here") == ["CM001"]
    assert rules("[.wat x] and [=nope 5%]") == ["CM002", "CM002"]
    assert rules("[=success high]") == ["CM004"]
    assert rules("::: success Deploy\nnever closed") == ["CM005"]
    assert lint(":::: success\n::: fields\nRegion: eastus\n:::\n::::") == []


def test_lint_ignores_escaped_markdown_links_and_fenced_code():
    assert lint(r"\[!succes x] and [=foo](https://example.com) and [!bar][ref]") == []
    assert lint("```\n[!succes x]\n::: succes T\n```\n") == []


def test_lint_can_disable_rules():
    source = "See `[!pass]` and [!succes 3]"
    assert rules(source) == ["CM001", "CM002"]
    assert rules(source, disable=["CM001"]) == ["CM002"]
    assert lint(source, disable=["CM001", "CM002"]) == []
