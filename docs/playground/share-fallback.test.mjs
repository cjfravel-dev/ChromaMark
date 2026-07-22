import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SHARE_URL_LENGTH,
  chooseShareTarget,
  buildIssueUrl,
} from './share-fallback.mjs';

test('short share URLs are returned as a copyable link', () => {
  const url = 'https://example.com/playground/#u.abc';
  const target = chooseShareTarget({ url, source: 'hi' });
  assert.deepEqual(target, { kind: 'link', url });
});

test('oversized share URLs fall back to a prefilled GitHub issue', () => {
  const url = 'https://example.com/playground/#z.' + 'a'.repeat(MAX_SHARE_URL_LENGTH);
  const target = chooseShareTarget({ url, source: '# Big report\n\nlots of content' });
  assert.equal(target.kind, 'issue');
  assert.match(target.url, /github\.com\/cjfravel-dev\/ChromaMark\/issues\/new\?/);
  assert.match(decodeURIComponent(target.url), /```chromamark/);
  assert.match(decodeURIComponent(target.url), /# Big report/);
});

test('issue body truncates very large sources and notes the omission', () => {
  const source = 'x'.repeat(40000);
  const url = buildIssueUrl(source);
  assert.ok(url.length < 30000, 'issue URL must stay within GitHub limits');
  assert.match(decodeURIComponent(url), /truncated/i);
});

test('a custom repo and threshold are honored', () => {
  const url = 'https://example.com/#' + 'a'.repeat(50);
  const target = chooseShareTarget({
    url,
    source: 'body',
    maxUrlLength: 20,
    issueRepo: 'octo/repo',
  });
  assert.equal(target.kind, 'issue');
  assert.match(target.url, /github\.com\/octo\/repo\/issues\/new/);
});
