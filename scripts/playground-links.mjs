import { gzipSync, gunzipSync } from 'node:zlib';

const START = '<!-- playground-demo:start -->';
const END = '<!-- playground-demo:end -->';

export function extractPlaygroundDemo(readme) {
  const firstStart = readme.indexOf(START);
  const firstEnd = readme.indexOf(END);
  if (
    firstStart === -1
    || firstEnd === -1
    || firstStart !== readme.lastIndexOf(START)
    || firstEnd !== readme.lastIndexOf(END)
    || firstEnd < firstStart
  ) {
    throw new Error('README.cm must contain exactly one playground demo marker pair');
  }
  return `${readme.slice(firstStart + START.length, firstEnd).trim()}\n`;
}

export function encodePlaygroundHash(source) {
  return `z.${gzipSync(Buffer.from(source, 'utf8'), { level: 9, mtime: 0 }).toString('base64url')}`;
}

export function decodePlaygroundHash(hash) {
  if (!hash.startsWith('z.')) return null;
  return gunzipSync(Buffer.from(hash.slice(2), 'base64url')).toString('utf8');
}
