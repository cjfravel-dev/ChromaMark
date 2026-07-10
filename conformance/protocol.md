# ChromaMark conformance runner protocol

The conformance kit is language-neutral. An implementation does not need the
JavaScript runner to claim compatibility.

## Inputs

1. Load `cases.json` as UTF-8 JSON.
2. Validate it against `schema.json` or apply equivalent structural checks.
   Fixture `name` values must also be unique; this cross-item constraint is not
   expressible by the JSON Schema.
3. Require the corpus `languageVersion` to equal the language version claimed
   by the renderer.
4. For each fixture, call the renderer with `source` and the optional boolean
   feature flags in `options`.

Unless a future fixture explicitly declares another profile, render with raw
HTML disabled and linkification enabled, matching the safe reference-renderer
profile.

## Comparison

Compare the returned HTML to `html` exactly:

- do not normalize whitespace or line endings
- do not parse and reserialize HTML
- do not reorder attributes
- do not trim a trailing newline

A renderer error, non-string result, or exact mismatch fails that fixture.
Reports should identify the fixture `name`, expected HTML, actual HTML when
available, and renderer error when applicable.

## Compatibility claim

An implementation passes the kit only when every applicable fixture passes.
Passing one corpus version does not imply compatibility with another ChromaMark
language version. See the project
[compatibility policy](../docs/compatibility.md) for authority and versioning.

## Licensing

The schema, corpus, protocol, and runner are MIT-licensed executable
conformance materials so third-party implementations can reuse them freely.
