/** Versioned browser codec for shareable playground URL hashes. */
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64(value) {
  if (!/^[A-Za-z0-9+/_=-]+$/.test(value)) throw new Error('invalid base64');
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function transform(bytes, stream) {
  const response = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await response.arrayBuffer());
}

export async function encodeShare(text) {
  const bytes = encoder.encode(String(text));
  const plain = `u.${toBase64Url(bytes)}`;
  if (typeof CompressionStream === 'undefined') return plain;
  try {
    const compressed = `z.${toBase64Url(await transform(bytes, new CompressionStream('gzip')))}`;
    return compressed.length < plain.length ? compressed : plain;
  } catch {
    return plain;
  }
}

export async function decodeShare(hash) {
  if (!hash) return null;
  try {
    if (hash.startsWith('z.')) {
      if (typeof DecompressionStream === 'undefined') return null;
      return decoder.decode(await transform(fromBase64(hash.slice(2)), new DecompressionStream('gzip')));
    }
    if (hash.startsWith('u.')) return decoder.decode(fromBase64(hash.slice(2)));
    if (hash.includes('.')) return null;
    return decoder.decode(fromBase64(hash));
  } catch {
    return null;
  }
}
