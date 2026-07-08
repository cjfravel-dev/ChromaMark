from chromamark import ChromaDoc


def test_emits_block():
    doc = ChromaDoc()
    doc.success("All good", "3/3 healthy")
    cm = doc.to_cm()
    assert "::: success All good" in cm
    assert "3/3 healthy" in cm
    assert cm.rstrip().endswith(":::")


def test_pill_and_fields():
    doc = ChromaDoc()
    doc.fields(Region="eastus", Status=doc.pill("ok", "healthy"))
    cm = doc.to_cm()
    assert "::: fields" in cm
    assert "Region: eastus" in cm
    assert "Status: [!ok healthy]" in cm


def test_inline_helpers():
    doc = ChromaDoc()
    assert doc.pill("pass") == "[!pass]"
    assert doc.pill("success", "PASS") == "[!success PASS]"
    assert doc.tint("danger", "bad") == "[.danger bad]"
    assert doc.meter("info", "87%") == "[=info 87%]"


def test_details_and_table():
    doc = ChromaDoc()
    doc.details("Trace", "line one", open=True, tone="danger")
    doc.table(["Stage", "Result"], [["unit", doc.pill("pass", "247")]])
    cm = doc.to_cm()
    assert "::: details open danger Trace" in cm
    assert "| Stage | Result |" in cm
    assert "[!pass 247]" in cm


def test_to_html():
    doc = ChromaDoc()
    doc.success("Done")
    html = doc.to_html()
    assert 'class="cm-block" data-tone="success"' in html


def test_repr_html_includes_theme():
    doc = ChromaDoc()
    doc.info("hi")
    h = doc._repr_html_()
    assert "cm-block" in h
    assert "<style" in h


def test_nested_block_uses_more_colons():
    doc = ChromaDoc()
    inner = ChromaDoc().fields(Region="eastus")
    doc.success("Deploy", inner)
    cm = doc.to_cm()
    # outer fence must be longer than the inner ::: fields
    assert "::::" in cm
    assert "::: fields" in cm
