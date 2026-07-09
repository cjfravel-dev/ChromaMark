/**
 * The eval task set. Each task is a natural-language instruction that should
 * elicit specific ChromaMark constructs, listed in `requires`. Kept small and
 * representative so a run is cheap; add tasks as coverage needs grow.
 */

export const tasks = [
  {
    id: 'deploy-report',
    requires: ['block', 'fields', 'pill'],
    instruction:
      'Write a short deployment status report for the service "recon" that succeeded ' +
      'in 3m12s in region eastus with 3 of 3 replicas healthy. Use a colored success ' +
      'block that contains a key/value fields list, and include at least one status pill.',
  },
  {
    id: 'test-summary',
    requires: ['table', 'pill', 'details'],
    instruction:
      'Summarize a test run: 247 unit tests passed and 3 of 88 integration tests failed. ' +
      'Show the stages in a table with pass/fail pills, and put the three failing ' +
      'integration test names inside a collapsible danger section.',
  },
  {
    id: 'progress',
    requires: ['meter', 'pill'],
    instruction:
      'Report build progress: test coverage is 87% and the linter reported 12 warnings. ' +
      'Show coverage as a progress meter and the lint count as a warning pill.',
  },
  {
    id: 'review-diff',
    requires: ['block', 'critic'],
    instruction:
      'Give a one-line code-review note inside an info block that suggests changing the ' +
      'word "expected" to "actual", using inline change tracking to show the substitution.',
  },
  {
    id: 'release-note',
    requires: ['heading', 'pill'],
    instruction:
      'Write a release note with the heading "Release v1.2.0" and mark it with a success ' +
      'pill that reads SHIPPED.',
  },
];
