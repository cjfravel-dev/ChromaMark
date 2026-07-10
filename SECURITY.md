# Security policy

ChromaMark renders agent-generated and other untrusted text, so escaping and
injection vulnerabilities are treated as security issues.

## Supported versions

Security fixes are provided for the latest release line of each package:

| Package | Supported line |
| --- | --- |
| `@chromamark/renderer` | `0.4.x` |
| `@chromamark/cli` | `0.3.x` |
| `chromamark` (PyPI) | `0.2.x` |
| `chromamark-vscode` | `0.2.x` |

Older release lines may not receive security updates. Upgrade to the latest
published version before reporting behavior that has already been fixed.

## Reporting a vulnerability

Use GitHub's
[private vulnerability reporting](https://github.com/cjfravel-dev/ChromaMark/security/advisories/new)
to send the maintainers a confidential report. Do not open a public issue,
discussion, or pull request for an undisclosed vulnerability.

Include:

- The affected package and version.
- A minimal reproducer or malicious ChromaMark input.
- The resulting HTML, DOM, terminal output, or extension behavior.
- The security impact and any required host configuration.
- Suggested remediation, if known.

Reports are reviewed privately. The maintainers will coordinate validation,
remediation, release timing, and disclosure through the advisory.

## Security model

The default renderer disables raw HTML and escapes ChromaMark-controlled content.
Custom colors accept only constrained color values. Security reports are
especially useful when input can:

- Inject executable HTML, JavaScript, event handlers, or unsafe URLs.
- Escape an attribute or CSS value.
- Bypass container-body, title, summary, or field escaping.
- Cause unsafe filesystem behavior in the CLI.
- Execute code through the VS Code preview or browser auto-render path.

Behavior that requires a host application to explicitly enable unsafe raw HTML
outside ChromaMark containers should still be reported when ChromaMark weakens
or bypasses the host's expected boundary.
