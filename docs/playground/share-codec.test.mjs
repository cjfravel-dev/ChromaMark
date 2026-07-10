import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeShare, decodeShare } from './share-codec.mjs';

test('compressed share hashes round-trip realistic Unicode reports', async () => {
  const source = ('::: success Deploy ✅\nRegion: eastus [!pass]\n:::\n').repeat(20);
  const hash = await encodeShare(source);
  assert.match(hash, /^z\./);
  assert.equal(await decodeShare(hash), source);
  const legacyLength = Buffer.from(source, 'utf8').toString('base64').length;
  assert.ok(hash.length < legacyLength * 0.7, `${hash.length} should be much shorter than ${legacyLength}`);
});

test('small payloads use uncompressed base64url when it is shorter', async () => {
  const hash = await encodeShare('hi');
  assert.match(hash, /^u\./);
  assert.equal(await decodeShare(hash), 'hi');
});

test('decoder preserves backward compatibility with legacy base64 hashes', async () => {
  const source = 'Legacy 🎨 [!pass]';
  const legacy = Buffer.from(source, 'utf8').toString('base64');
  assert.equal(await decodeShare(legacy), source);
});

test('malformed or unsupported hashes return null', async () => {
  assert.equal(await decodeShare('z.not-valid'), null);
  assert.equal(await decodeShare('x.payload'), null);
  assert.equal(await decodeShare(''), null);
});
