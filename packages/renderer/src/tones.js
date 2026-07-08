/**
 * The ChromaMark color vocabulary: semantic tones plus a hex/name escape hatch.
 * Shared by containers, pills, colored text, and meters.
 */

/** Canonical semantic tones, in vocabulary order. */
export const TONES = ['success', 'danger', 'warning', 'info', 'tip', 'muted'];

/** Aliases mapping to a canonical tone. */
export const ALIASES = {
  ok: 'success',
  pass: 'success',
  error: 'danger',
  fail: 'danger',
  warn: 'warning',
  note: 'info',
  hint: 'tip',
  skip: 'muted',
};

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const COLOR_NAME = /^[a-zA-Z][a-zA-Z0-9]*$/;

/**
 * True for a color value safe to emit inside a `style="--fg:…"` attribute:
 * a hex literal or a plain CSS color name. Functional forms are rejected to
 * keep untrusted input from injecting arbitrary CSS.
 */
export function isSafeColor(value) {
  return isHex(value) || COLOR_NAME.test(value);
}

/**
 * Resolve a token to a canonical tone, or null if it is not a known tone/alias.
 * Case-insensitive.
 */
export function resolveTone(name) {
  if (typeof name !== 'string') return null;
  const key = name.toLowerCase();
  if (TONES.includes(key)) return key;
  if (Object.prototype.hasOwnProperty.call(ALIASES, key)) return ALIASES[key];
  return null;
}

/** True for a valid `#rgb` / `#rrggbb` literal. */
export function isHex(value) {
  return typeof value === 'string' && HEX.test(value);
}

/**
 * Parse the leading spec token of an inline construct or container attr.
 * Accepts a tone/alias, `color=<hex|name>`, or a bare `#hex`.
 * Returns `{ tone, color }` (exactly one non-null) or null when unrecognized.
 * Bare CSS color names are intentionally rejected here to avoid swallowing
 * ordinary label words; use the explicit `color=<name>` escape hatch instead.
 */
export function parseSpec(token) {
  if (typeof token !== 'string' || token.length === 0) return null;

  if (token.toLowerCase().startsWith('color=')) {
    const value = token.slice('color='.length);
    if (!isSafeColor(value)) return null;
    return { tone: null, color: value };
  }

  if (isHex(token)) return { tone: null, color: token };

  const tone = resolveTone(token);
  if (tone) return { tone, color: null };

  return null;
}
