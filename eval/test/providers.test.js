import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openaiProvider, anthropicProvider } from '../providers.js';

function fakeResponse({ status = 200, body = '', headers = {} }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k) => headers[k.toLowerCase()] ?? null },
    async text() { return typeof body === 'string' ? body : JSON.stringify(body); },
    async json() { return typeof body === 'string' ? JSON.parse(body) : body; },
  };
}

test('openai provider retries on 429 then succeeds', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return calls === 1
      ? fakeResponse({ status: 429, headers: { 'retry-after': '0' } })
      : fakeResponse({ status: 200, body: { choices: [{ message: { content: 'hi' } }] } });
  };
  const p = openaiProvider({ apiKey: 'x', fetchImpl, retries: 3, retryBaseMs: 1 });
  assert.equal(await p.complete('sys', 'user'), 'hi');
  assert.equal(calls, 2);
});

test('openai provider does not retry a 400 and throws', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return fakeResponse({ status: 400, body: 'bad request' }); };
  const p = openaiProvider({ apiKey: 'x', fetchImpl });
  await assert.rejects(() => p.complete('s', 'u'), /OpenAI 400/);
  assert.equal(calls, 1);
});

test('openai provider retries without temperature when the model rejects it', async () => {
  const bodies = [];
  const fetchImpl = async (url, init) => {
    bodies.push(JSON.parse(init.body));
    return bodies.length === 1
      ? fakeResponse({ status: 400, body: { error: { message: "'temperature' does not support 0 with this model" } } })
      : fakeResponse({ status: 200, body: { choices: [{ message: { content: 'ok5' } }] } });
  };
  const p = openaiProvider({ apiKey: 'x', fetchImpl, retryBaseMs: 1 });
  assert.equal(await p.complete('s', 'u'), 'ok5');
  assert.equal(bodies.length, 2);
  assert.equal('temperature' in bodies[0], true);
  assert.equal('temperature' in bodies[1], false);
});

test('anthropic provider retries on 503 then succeeds', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return calls < 2
      ? fakeResponse({ status: 503 })
      : fakeResponse({ status: 200, body: { content: [{ text: 'yo' }] } });
  };
  const p = anthropicProvider({ apiKey: 'x', fetchImpl, retries: 3, retryBaseMs: 1 });
  assert.equal(await p.complete('sys', 'user'), 'yo');
  assert.equal(calls, 2);
});

test('provider retries on a thrown network error, then succeeds', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls < 2) throw new Error('fetch failed');
    return fakeResponse({ status: 200, body: { choices: [{ message: { content: 'net' } }] } });
  };
  const p = openaiProvider({ apiKey: 'x', fetchImpl, retries: 3, retryBaseMs: 1 });
  assert.equal(await p.complete('s', 'u'), 'net');
  assert.equal(calls, 2);
});

test('provider does not retry a timeout (AbortError) — it fails fast', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    const err = new Error('aborted');
    err.name = 'AbortError';
    throw err;
  };
  const p = openaiProvider({ apiKey: 'x', fetchImpl, retries: 4, retryBaseMs: 1 });
  await assert.rejects(() => p.complete('s', 'u'), /aborted/);
  assert.equal(calls, 1);
});
