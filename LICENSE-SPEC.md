# ChromaMark Specification License

The following specification materials are licensed under the
[Creative Commons Attribution-ShareAlike 4.0 International License][cc-by-sa]:

- `SPEC.md`
- `docs/grammar.ebnf`
- `docs/llms.txt`
- `docs/compatibility.md`

## ChromaMark attribution

**ChromaMark Specification**, Copyright 2026 CJ Fravel.

Source: <https://github.com/cjfravel-dev/ChromaMark>

License: [CC BY-SA 4.0][cc-by-sa]

When sharing or adapting these materials, retain this attribution, link to the
source and license, indicate whether you made changes, and distribute adapted
specification material under CC BY-SA 4.0.

## Upstream specifications

The ChromaMark specification builds on and adapts:

- **[CommonMark Specification](https://spec.commonmark.org/)**, Copyright
  2014–2016 John MacFarlane,
  [CC BY-SA 4.0][commonmark-license].
- **[GitHub Flavored Markdown Specification](https://github.github.com/gfm/)**,
  Copyright 2016–2019 GitHub, Inc., [CC BY-SA 4.0][cc-by-sa].

## Changes from the upstream specifications

ChromaMark incorporates CommonMark and GitHub Flavored Markdown as its base
dialect, disables raw HTML in its default renderer for safety, and adds colored
containers, pills, text, progress meters, fields, collapsible sections, and
CriticMarkup-based inline change tracking. ChromaMark's grammar, streaming
contract, color vocabulary, rendering contract, and conformance materials are
maintained by the ChromaMark project.

The software implementations, tests, build tooling, and other files not listed
in the scope above are licensed separately under the
[MIT License](./LICENSE.md).

The conformance corpus in `conformance/` is an executable rendering contract and
test fixture, not specification prose. It is intentionally licensed under MIT
with the software so implementations can reuse it without applying ShareAlike
to their code or test suites.

[cc-by-sa]: https://creativecommons.org/licenses/by-sa/4.0/
[commonmark-license]: https://github.com/commonmark/commonmark-spec/blob/master/LICENSE
