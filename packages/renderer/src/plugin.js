import inlinePlugin from './inline.js';
import criticPlugin from './critic.js';
import containerPlugin from './containers.js';
import rowGroupPlugin from './rowgroups.js';

const DEFAULTS = {
  container: true,
  details: true,
  fields: true,
  pill: true,
  text: true,
  meter: true,
  critic: true,
  rows: true,
};

export default function chromamark(md, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  if (opts.pill || opts.text || opts.meter) {
    inlinePlugin(md, { pill: opts.pill, text: opts.text, meter: opts.meter });
  }
  if (opts.critic) criticPlugin(md);
  if (opts.rows) rowGroupPlugin(md);
  if (opts.container || opts.details || opts.fields) {
    containerPlugin(md, {
      callout: opts.container,
      details: opts.details,
      fields: opts.fields,
    });
  }
}
