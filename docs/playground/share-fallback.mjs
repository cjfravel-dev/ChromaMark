/** Chooses between a copyable share link and a GitHub-issue fallback. */

// Conservative cross-browser/host cap; long hashes silently break some hosts.
export const MAX_SHARE_URL_LENGTH = 8000;

// GitHub rejects issue-creation URLs beyond ~8k; keep the body well under that.
const MAX_ISSUE_BODY_CHARS = 6000;
const DEFAULT_ISSUE_REPO = 'cjfravel-dev/ChromaMark';

export function buildIssueUrl(source, issueRepo = DEFAULT_ISSUE_REPO) {
  const raw = source == null ? '' : String(source);
  let body = raw;
  let note = '';
  if (body.length > MAX_ISSUE_BODY_CHARS) {
    body = body.slice(0, MAX_ISSUE_BODY_CHARS);
    note = `\n\n_Source truncated to ${MAX_ISSUE_BODY_CHARS} characters; attach the full ` +
      `.cm file to reproduce._`;
  }
  const title = 'Playground share: ChromaMark source';
  const issueBody = `Shared from the ChromaMark playground.\n\n\`\`\`chromamark\n${body}\n\`\`\`${note}`;
  const query =
    `title=${encodeURIComponent(title)}&body=${encodeURIComponent(issueBody)}`;
  return `https://github.com/${issueRepo}/issues/new?${query}`;
}

export function chooseShareTarget({
  url,
  source,
  maxUrlLength = MAX_SHARE_URL_LENGTH,
  issueRepo = DEFAULT_ISSUE_REPO,
} = {}) {
  if (typeof url === 'string' && url.length <= maxUrlLength) {
    return { kind: 'link', url };
  }
  return { kind: 'issue', url: buildIssueUrl(source, issueRepo) };
}
