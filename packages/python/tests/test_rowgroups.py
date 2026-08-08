from chromamark import create_renderer, render


TOGGLE = (
    '<button class="cm-row-toggle" type="button" aria-expanded="false"'
    ' aria-label="Toggle nested rows"></button>'
)


def test_basic_parent_child_row_group():
    html = render("| ID | Task |\n| --- | --- |\n| 200 | parent |\n| ↳ 195 | child |")
    assert '<tr class="cm-row cm-row-parent" data-cm-depth="0">' in html
    assert '<tr class="cm-row cm-row-child" data-cm-depth="1">' in html
    assert f"<td>{TOGGLE}200</td>" in html
    assert "<td>195</td>" in html
    assert "↳ 195" not in html


def test_nested_parent_child_classes():
    html = render("| ID |\n| --- |\n| 1 |\n| ↳ 2 |\n| ↳↳ 3 |")
    assert '<tr class="cm-row cm-row-parent" data-cm-depth="0">' in html
    assert '<tr class="cm-row cm-row-parent cm-row-child" data-cm-depth="1">' in html
    assert '<tr class="cm-row cm-row-child" data-cm-depth="2">' in html
    assert f"<td>{TOGGLE}2</td>" in html


def test_ascii_and_arrow_markers_are_equivalent():
    arrow = render("| ID |\n| --- |\n| 1 |\n| ↳ ↳ 2 |")
    ascii_marker = render("| ID |\n| --- |\n| 1 |\n| >> 2 |")
    assert arrow == ascii_marker
    assert 'data-cm-depth="1"' in arrow
    assert "<td>2</td>" in arrow


def test_depth_clamping_and_orphan_first_row():
    orphan = render("| ID |\n| --- |\n| >> 1 |")
    assert '<tr class="cm-row" data-cm-depth="0">' in orphan
    assert "<td>1</td>" in orphan

    clamped = render("| ID |\n| --- |\n| 1 |\n| >>> 2 |")
    assert '<tr class="cm-row cm-row-parent" data-cm-depth="0">' in clamped
    assert '<tr class="cm-row cm-row-child" data-cm-depth="1">' in clamped
    assert "<td>2</td>" in clamped


def test_only_first_body_cell_markers_are_significant():
    html = render("| ID | Task |\n| --- | --- |\n| 1 | > not a marker |\n| 2 | plain |")
    assert "cm-row" not in html
    assert "<td>&gt; not a marker</td>" in html


def test_table_without_markers_is_completely_untouched():
    source = "| ID | Task |\n| --- | --- |\n| 1 | parent |\n| 2 | child |"
    assert render(source) == create_renderer(rows=False).render(source)


def test_rows_feature_toggle_leaves_markers_literal():
    html = create_renderer(rows=False).render("| ID |\n| --- |\n| ↳ 1 |")
    assert "cm-row" not in html
    assert "<td>↳ 1</td>" in html
