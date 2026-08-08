# ChromaMark compatibility policy

> Licensed under [CC BY-SA 4.0](../LICENSE-SPEC.md).

Language version `0.1` is normatively defined by [`SPEC.md`](../SPEC.md).
[`grammar.ebnf`](./grammar.ebnf) is its formal syntax companion, and the shared
[`conformance` corpus](../conformance/) is the executable rendering contract.
An implementation that disagrees with these sources has a defect; implementation
behavior does not silently override the documented contract.

## Versioning

ChromaMark language versions use `major.minor`:

- Before `1.0`, a minor version may add syntax or make a necessary incompatible
  correction. Such changes require a specification update, conformance cases,
  and release notes.
- At and after `1.0`, a major version is required for incompatible syntax or
  rendering changes. Minor versions add backward-compatible language features.
- Editorial clarifications that do not change accepted input or rendered output
  do not change the language version.

Package versions are independent from the language version. The npm renderer,
CLI, Python package, and VS Code extension may release at different package
versions while implementing the same language contract.

## Compatibility requirements

An implementation claiming ChromaMark `0.1` compatibility must:

1. Preserve CommonMark + GFM syntax and behavior. Raw HTML follows the host
   renderer's policy.
2. Match the extension syntax and degradation behavior in the specification.
3. Pass the applicable cases in `conformance/cases.json`; unless a case
   specifies otherwise, the corpus uses the safe reference-renderer profile.
4. Provide a safe profile for untrusted input. The reference convenience
   renderers disable raw HTML by default and reject unsafe custom color values.

Unknown or malformed ChromaMark constructs must remain readable literal text.
This degradation rule allows older renderers to display documents that use
future constructs without hiding their content.

## Changing the contract

Every behavior change must update the specification and shared conformance
corpus in the same pull request. Changes that affect only one implementation
are defects unless the compatibility documentation explicitly records an
upstream engine difference.

Specifying a construct as **proposed** for a future language version is not a
behavior change: it adds no conformance cases, changes no rendered output, and
leaves the current contract intact. Such a construct is marked as proposed in
`SPEC.md` and `grammar.ebnf`, and existing renderers stay correct by leaving its
syntax as literal text. It becomes part of the contract only when the
conformance cases and the reference implementations land, at which point the
proposed markers are removed and the language version is bumped.

## Proposed for 0.2

| Construct | Status |
| --- | --- |
| Collapsible table row groups (`↳` / `>` in a table's first cell) | Specified; conformance corpus and implementations pending |

Until that work lands, the language version remains `0.1` and no implementation
is expected to render row groups as collapsible.
