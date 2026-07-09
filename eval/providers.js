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
  } = options;
  return {
    name,
    async complete(system, user) {
      if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
      const res = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
      });
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
  } = options;
  return {
    name,
    async complete(system, user) {
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
      const res = await fetch(`${baseURL.replace(/\/$/, '')}/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
      });
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
