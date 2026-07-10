"""Command-line entry point for ChromaMark validation."""

import argparse
import sys
from pathlib import Path
from typing import List, Optional

from .lint import lint


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="chromamark", description="Validate ChromaMark documents")
    commands = parser.add_subparsers(dest="command", required=True)
    lint_parser = commands.add_parser("lint", help="check for common ChromaMark mistakes")
    lint_parser.add_argument("input", nargs="?", help="input .cm file, or - for stdin")
    lint_parser.add_argument(
        "--disable",
        action="append",
        default=[],
        metavar="RULES",
        help="comma-separated rule ids to suppress (for example CM001,CM003)",
    )
    return parser


def _read_source(input_path: Optional[str]):
    if input_path == "-" or (input_path is None and not sys.stdin.isatty()):
        return sys.stdin.read(), "<stdin>"
    if input_path is None:
        return None
    path = Path(input_path)
    return path.read_text(encoding="utf-8"), str(path)


def main(argv: Optional[List[str]] = None) -> int:
    """Run the lint CLI and return a process exit code."""
    args = _parser().parse_args(argv)
    if args.command != "lint":
        return 2

    try:
        source = _read_source(args.input)
    except OSError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2
    if source is None:
        print("error: lint needs an input file or piped stdin", file=sys.stderr)
        return 2

    text, display_path = source
    disabled = [
        rule.strip()
        for group in args.disable
        for rule in group.split(",")
        if rule.strip()
    ]
    diagnostics = lint(text, disable=disabled)
    for diagnostic in diagnostics:
        print(
            f'{display_path}:{diagnostic["line"]}:{diagnostic["column"]}  '
            f'{diagnostic["severity"]}  {diagnostic["rule"]}  {diagnostic["message"]}'
        )
    if diagnostics:
        suffix = "" if len(diagnostics) == 1 else "s"
        print(f"✗ {len(diagnostics)} problem{suffix}", file=sys.stderr)
        return 1
    print(f"✓ {display_path}: no problems", file=sys.stderr)
    return 0
