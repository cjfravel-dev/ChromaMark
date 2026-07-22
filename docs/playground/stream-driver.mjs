/** Splits a ChromaMark source into ordered chunks for streaming previews. */
export const DEFAULT_CHUNK_SIZE = 18;

/**
 * Break `text` into cumulative-append chunks whose concatenation is the exact
 * original source. Chunks end on whitespace so words and inline constructs are
 * not split mid-token; a single token longer than `chunkSize` is emitted whole.
 */
export function chunkText(text, chunkSize = DEFAULT_CHUNK_SIZE) {
  const str = text == null ? '' : String(text);
  if (!str) return [];
  const size = Math.max(1, Math.floor(Number(chunkSize) || DEFAULT_CHUNK_SIZE));
  const chunks = [];
  let index = 0;
  while (index < str.length) {
    let end = Math.min(str.length, index + size);
    while (end < str.length && !/\s/.test(str[end - 1])) end++;
    chunks.push(str.slice(index, end));
    index = end;
  }
  return chunks;
}
