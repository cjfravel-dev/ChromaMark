/**
 * Canned answers for the mock provider — representative of what a capable model
 * emits. Four are correct; `release-note` deliberately wraps its pill in
 * backticks (the documented #1 gotcha) so an offline `npm run eval` demonstrates
 * the harness catching a real failure.
 */

export const fixtures = {
  'deploy-report': `:::: success Deploy succeeded in 3m12s
::: fields
Service: recon
Region: eastus
Replicas: 3/3 [!ok healthy]
:::
::::`,

  'test-summary': `| Stage       | Result          |
| ----------- | --------------- |
| unit        | [!pass 247]     |
| integration | [!fail 3 of 88] |

::: details danger Integration failures (3)
- test_recon_merge_precedence
- test_flush_ordering
- test_retry_backoff
:::`,

  progress: 'Coverage [=success 87%] · lint [!warn 12]',

  'review-diff': `::: info Review note
Consider {~~expected~>actual~~} to match the assertion.
:::`,

  // Intentionally flawed: a pill wrapped in backticks renders as code (CM001).
  'release-note': `# Release v1.2.0

\`[!success SHIPPED]\``,
};
