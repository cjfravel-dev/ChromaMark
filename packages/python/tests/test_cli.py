import io

from chromamark.cli import main


class TtyInput(io.StringIO):
    def isatty(self):
        return True


def test_lint_command_reports_diagnostics_and_returns_one(tmp_path, capsys):
    source = tmp_path / "bad.cm"
    source.write_text("Build [!succes 3]\n", encoding="utf-8")

    assert main(["lint", str(source)]) == 1
    captured = capsys.readouterr()
    assert f"{source}:1:7  warning  CM002" in captured.out
    assert "1 problem" in captured.err


def test_lint_command_returns_zero_for_clean_input(tmp_path, capsys):
    source = tmp_path / "ok.cm"
    source.write_text("::: success\nReady [!pass]\n:::\n", encoding="utf-8")

    assert main(["lint", str(source)]) == 0
    captured = capsys.readouterr()
    assert captured.out == ""
    assert f"{source}: no problems" in captured.err


def test_lint_command_reads_stdin_and_supports_disabled_rules(monkeypatch, capsys):
    monkeypatch.setattr("sys.stdin", io.StringIO("See `[!pass]` and [!succes 3]\n"))

    assert main(["lint", "--disable", "CM001"]) == 1
    captured = capsys.readouterr()
    assert "<stdin>:1:" in captured.out
    assert "CM001" not in captured.out
    assert "CM002" in captured.out


def test_lint_command_requires_input_when_stdin_is_a_tty(monkeypatch, capsys):
    monkeypatch.setattr("sys.stdin", TtyInput())

    assert main(["lint"]) == 2
    assert "needs an input file or piped stdin" in capsys.readouterr().err


def test_lint_command_reports_file_errors_without_tracebacks(tmp_path, capsys):
    missing = tmp_path / "missing.cm"

    assert main(["lint", str(missing)]) == 2
    captured = capsys.readouterr()
    assert captured.err.startswith("error:")
    assert "Traceback" not in captured.err
