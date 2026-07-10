# ChromaMark compatibility policy

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

1. Preserve CommonMark + GFM behavior except for the documented raw-HTML safety
   rule.
2. Match the extension syntax and degradation behavior in the specification.
3. Pass the applicable cases in `conformance/cases.json`.
4. Escape untrusted content and reject unsafe custom color values as specified.

Unknown or malformed ChromaMark constructs must remain readable literal text.
This degradation rule allows older renderers to display documents that use
future constructs without hiding their content.

## Changing the contract

Every behavior change must update the specification and shared conformance
corpus in the same pull request. Changes that affect only one implementation
are defects unless the compatibility documentation explicitly records an
upstream engine difference.
