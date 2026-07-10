import { isSafeColor, TONES } from './tones.js';

const GITHUB_LIGHT = {
  '--cm-success-fg': '#1a7f37', '--cm-success-bg': '#dafbe1', '--cm-success-bd': '#2da44e',
  '--cm-danger-fg': '#cf222e', '--cm-danger-bg': '#ffebe9', '--cm-danger-bd': '#ff8182',
  '--cm-warning-fg': '#9a6700', '--cm-warning-bg': '#fff8c5', '--cm-warning-bd': '#d4a72c',
  '--cm-info-fg': '#0969da', '--cm-info-bg': '#ddf4ff', '--cm-info-bd': '#54aeff',
  '--cm-tip-fg': '#0f7b6c', '--cm-tip-bg': '#d3f5f0', '--cm-tip-bd': '#3bc4b0',
  '--cm-muted-fg': '#656d76', '--cm-muted-bg': '#f6f8fa', '--cm-muted-bd': '#d0d7de',
  '--cm-neutral-bg': '#f6f8fa', '--cm-neutral-bd': '#d0d7de',
  '--cm-content-fg': '#1f2328',
};

const GITHUB_DARK = {
  '--cm-success-fg': '#3fb950', '--cm-success-bg': '#12261e', '--cm-success-bd': '#238636',
  '--cm-danger-fg': '#f85149', '--cm-danger-bg': '#25171c', '--cm-danger-bd': '#da3633',
  '--cm-warning-fg': '#d29922', '--cm-warning-bg': '#272115', '--cm-warning-bd': '#9e6a03',
  '--cm-info-fg': '#58a6ff', '--cm-info-bg': '#0d2233', '--cm-info-bd': '#1f6feb',
  '--cm-tip-fg': '#56d4c3', '--cm-tip-bg': '#0c2620', '--cm-tip-bd': '#1c6f63',
  '--cm-muted-fg': '#8b949e', '--cm-muted-bg': '#161b22', '--cm-muted-bd': '#30363d',
  '--cm-neutral-bg': '#161b22', '--cm-neutral-bd': '#30363d',
  '--cm-content-fg': '#e6edf3',
};

const OCEAN = {
  '--cm-success-fg': '#047857', '--cm-success-bg': '#d1fae5', '--cm-success-bd': '#10b981',
  '--cm-danger-fg': '#be123c', '--cm-danger-bg': '#ffe4e6', '--cm-danger-bd': '#fb7185',
  '--cm-warning-fg': '#a16207', '--cm-warning-bg': '#fef9c3', '--cm-warning-bd': '#eab308',
  '--cm-info-fg': '#0369a1', '--cm-info-bg': '#e0f2fe', '--cm-info-bd': '#38bdf8',
  '--cm-tip-fg': '#0f766e', '--cm-tip-bg': '#ccfbf1', '--cm-tip-bd': '#2dd4bf',
  '--cm-muted-fg': '#475569', '--cm-muted-bg': '#f1f5f9', '--cm-muted-bd': '#cbd5e1',
  '--cm-neutral-bg': '#f8fafc', '--cm-neutral-bd': '#cbd5e1',
  '--cm-content-fg': '#0f172a',
};

const SUNSET = {
  '--cm-success-fg': '#4d7c0f', '--cm-success-bg': '#ecfccb', '--cm-success-bd': '#84cc16',
  '--cm-danger-fg': '#be123c', '--cm-danger-bg': '#fff1f2', '--cm-danger-bd': '#fb7185',
  '--cm-warning-fg': '#c2410c', '--cm-warning-bg': '#ffedd5', '--cm-warning-bd': '#fb923c',
  '--cm-info-fg': '#7e22ce', '--cm-info-bg': '#f3e8ff', '--cm-info-bd': '#c084fc',
  '--cm-tip-fg': '#be185d', '--cm-tip-bg': '#fce7f3', '--cm-tip-bd': '#f472b6',
  '--cm-muted-fg': '#6b7280', '--cm-muted-bg': '#f9fafb', '--cm-muted-bd': '#d1d5db',
  '--cm-neutral-bg': '#fff7ed', '--cm-neutral-bd': '#fed7aa',
  '--cm-content-fg': '#431407',
};

const MONOCHROME = {
  '--cm-success-fg': '#262626', '--cm-success-bg': '#f5f5f5', '--cm-success-bd': '#737373',
  '--cm-danger-fg': '#171717', '--cm-danger-bg': '#e5e5e5', '--cm-danger-bd': '#525252',
  '--cm-warning-fg': '#404040', '--cm-warning-bg': '#fafafa', '--cm-warning-bd': '#a3a3a3',
  '--cm-info-fg': '#262626', '--cm-info-bg': '#f5f5f5', '--cm-info-bd': '#737373',
  '--cm-tip-fg': '#404040', '--cm-tip-bg': '#fafafa', '--cm-tip-bd': '#a3a3a3',
  '--cm-muted-fg': '#737373', '--cm-muted-bg': '#fafafa', '--cm-muted-bd': '#d4d4d4',
  '--cm-neutral-bg': '#fafafa', '--cm-neutral-bd': '#d4d4d4',
  '--cm-content-fg': '#171717',
};

function freezePreset(preset) {
  return Object.freeze({ ...preset });
}

export const THEME_PRESETS = Object.freeze({
  'github-light': freezePreset(GITHUB_LIGHT),
  'github-dark': freezePreset(GITHUB_DARK),
  ocean: freezePreset(OCEAN),
  sunset: freezePreset(SUNSET),
  monochrome: freezePreset(MONOCHROME),
});

const SLOT_SUFFIX = {
  foreground: 'fg',
  background: 'bg',
  border: 'bd',
};

function safeColor(value, path) {
  if (typeof value !== 'string' || !isSafeColor(value)) {
    throw new Error(`unsafe theme color at ${path}`);
  }
  return value;
}

export function resolveTheme(input = 'github-light') {
  const config = typeof input === 'string' ? { preset: input } : input;
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('theme must be a preset name or configuration object');
  }
  const presetName = config.preset || 'github-light';
  const preset = THEME_PRESETS[presetName];
  if (!preset) throw new Error(`unknown theme preset "${presetName}"`);
  const variables = { ...preset };

  for (const [tone, slots] of Object.entries(config.tones || {})) {
    if (!TONES.includes(tone)) throw new Error(`unknown theme tone "${tone}"`);
    for (const [slot, value] of Object.entries(slots || {})) {
      const suffix = SLOT_SUFFIX[slot];
      if (!suffix) throw new Error(`unknown theme slot "${slot}"`);
      variables[`--cm-${tone}-${suffix}`] = safeColor(value, `tones.${tone}.${slot}`);
    }
  }
  for (const [slot, value] of Object.entries(config.neutral || {})) {
    if (!['foreground', 'background', 'border'].includes(slot)) {
      throw new Error(`unknown theme slot "${slot}"`);
    }
    const variable = slot === 'foreground'
      ? '--cm-content-fg'
      : `--cm-neutral-${slot === 'background' ? 'bg' : 'bd'}`;
    variables[variable] = safeColor(value, `neutral.${slot}`);
  }
  return variables;
}

export function applyTheme(target, input) {
  const element = target && target.documentElement ? target.documentElement : target;
  if (!element || !element.style || typeof element.style.setProperty !== 'function') {
    throw new TypeError('theme target must be a style-capable Element or Document');
  }
  for (const [name, value] of Object.entries(resolveTheme(input))) {
    element.style.setProperty(name, value);
  }
  return element;
}
