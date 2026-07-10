export const SAMPLES = {
  'Agent code review': `# Agent code review

::: warning Review summary [!warn 2 findings]
The implementation is close, but two correctness issues should be fixed before merge.
:::

| Area | Result |
| --- | --- |
| tests | [!pass 184] |
| security | [!pass clean] |
| correctness | [!warn 2] |

::: details danger Finding 1 — stale authorization cache
The cache key omits the tenant identifier, so one tenant can reuse another tenant's decision.

Suggested change: {~~cache[user]~>cache[tenant + ":" + user]~~}
:::

::: details warning Finding 2 — swallowed write error
Return the storage error instead of reporting a successful update.
:::
`,
  'Model evaluation': `# Model evaluation

::: fields
Model: agent-v4
Dataset: support-routing-v2
Samples: 500
Run: eval-2026-07-10
:::

Overall quality [=success 92.4%] [!pass above target]

| Metric | Score | Gate |
| --- | --- | --- |
| correctness | 94.8% | [!pass] |
| groundedness | 91.2% | [!pass] |
| format adherence | 88.6% | [!warn review] |

::: details warning Format failures (7)
Most failures wrapped status pills in backticks instead of emitting them bare.
:::
`,
  'Deployment report': `# Deployment report

:::: success Production deploy [!pass complete]
::: fields
Service: service-recon
Region: eastus
Version: 4.8.0
Replicas: 3/3
:::
::::

Build [!pass] · tests [!pass 247] · rollout [=success 100%]

::: details info Release notes
No schema migration required. Error rate remained below 0.1%.
:::
`,
  'Incident report': `# Incident report

::: danger API latency incident [!fail SEV-2]
P95 latency exceeded 4 seconds for 18 minutes.
:::

::: fields
Started: 13:04 UTC
Mitigated: 13:22 UTC
Affected: checkout-api
Status: [!ok resolved]
:::

::: details warning Timeline
- 13:04 alert fired
- 13:09 cache saturation identified
- 13:17 capacity increased
- 13:22 latency returned to baseline
:::

Follow-up progress [=success 3/4]
`,
};
