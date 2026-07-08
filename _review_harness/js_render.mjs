// Reads a JSON array of input strings from stdin, renders each through the
// ChromaMark JS renderer, and writes a JSON array of HTML strings to stdout.
import { render } from '/mnt/fast/source/ChromaMark/packages/renderer/src/index.js';

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { data += c; });
process.stdin.on('end', () => {
  const cases = JSON.parse(data);
  const out = cases.map((s) => {
    try { return render(s); } catch (e) { return 'ERROR:' + (e && e.message); }
  });
  process.stdout.write(JSON.stringify(out));
});
