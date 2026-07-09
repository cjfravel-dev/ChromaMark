/**
 * Model providers for the eval. Each provider is `{ name, complete(system,
 * user) }` returning the model's text. The mock provider runs fully offline; the
 * OpenAI-compatible and Anthropic providers call real APIs and are gated on env
 * keys, so nothing hits the network unless you ask for it.
 */

/** Offline provider that replays canned answers keyed by task id. */
export function mockProvider(fixtures = {}, name = 'mock') {
  return {
    name,
    async complete(system, user, meta = {}) {
      const key = meta.task && meta.task.id;
      return Object.prototype.hasOwnProperty.call(fixtures, key) ? fixtures[key] : '';
    },
  };
}

const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * POST with retry on 429 / 5xx / thrown network errors, honoring Retry-After and
 * aborting a stalled request after `timeoutMs`. Non-429 client errors pass through.
 */
async function requestWithRetry(fetchImpl, url, init, options = {}) {
  const { retries = 4, baseMs = 1000, sleep = defaultSleep, timeoutMs = 120000 } = options;
  const backoff = (attempt) => Math.min(baseMs * 2 ** attempt, 20000);
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      const ctrl = timeoutMs ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
      try {
        res = await fetchImpl(url, ctrl ? { ...init, signal: ctrl.signal } : init);
      } finally {
        if (timer) clearTimeout(timer);
      }
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(backoff(attempt));
      continue;
    }
    if (res.ok || attempt >= retries) return res;
    if (res.status !== 429 && res.status < 500) return res;
    const retryAfter = Number(res.headers.get && res.headers.get('retry-after'));
    await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : backoff(attempt));
  }
}

/**
 * OpenAI-compatible chat-completions provider. Works with OpenAI, Azure OpenAI,
 * GitHub Models, or any local server that speaks the same API — set OPENAI_BASE_URL.
 */
export function openaiProvider(options = {}) {
  const {
    apiKey = process.env.OPENAI_API_KEY,
    baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model = 'gpt-4o-mini',
    name = `openai:${model}`,
    temperature = 0,
    fetchImpl = globalThis.fetch,
    retries = 4,
    retryBaseMs = 1000,
  } = options;
  return {
    name,
    async complete(system, user) {
      if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
      const url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
      const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];
      const send = (withTemp) => requestWithRetry(fetchImpl, url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(withTemp ? { model, temperature, messages } : { model, messages }),
      }, { retries, baseMs: retryBaseMs });

      let res = await send(temperature != null);
      // Some models (e.g. the GPT-5 / o-series) reject a non-default temperature;
      // fall back to omitting it rather than counting that as a failure.
      if (!res.ok && res.status === 400 && temperature != null) {
        const text = await res.text();
        if (/temperature/i.test(text)) res = await send(false);
        else throw new Error(`OpenAI 400: ${text}`);
      }
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? '';
    },
  };
}

/** Anthropic Messages API provider. */
export function anthropicProvider(options = {}) {
  const {
    apiKey = process.env.ANTHROPIC_API_KEY,
    baseURL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
    model = 'claude-3-5-sonnet-latest',
    maxTokens = 1024,
    name = `anthropic:${model}`,
    fetchImpl = globalThis.fetch,
    retries = 4,
    retryBaseMs = 1000,
  } = options;
  return {
    name,
    async complete(system, user) {
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
      const res = await requestWithRetry(fetchImpl, `${baseURL.replace(/\/$/, '')}/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
      }, { retries, baseMs: retryBaseMs });
      if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return (data.content || []).map((b) => b.text || '').join('');
    },
  };
}

/**
 * Build a provider from a `name[:model]` spec.
 *   mock                      → offline replay (needs fixtures)
 *   openai[:model]            → OpenAI-compatible (OPENAI_API_KEY [, OPENAI_BASE_URL])
 *   anthropic[:model]         → Anthropic (ANTHROPIC_API_KEY)
 */
export function providerFromSpec(spec, { fixtures } = {}) {
  const [kind, ...rest] = spec.split(':');
  const model = rest.join(':') || undefined;
  switch (kind) {
    case 'mock': return mockProvider(fixtures || {});
    case 'openai': return openaiProvider(model ? { model } : {});
    case 'anthropic': return anthropicProvider(model ? { model } : {});
    default: throw new Error(`unknown provider "${spec}" (use mock, openai[:model], or anthropic[:model])`);
  }
}
