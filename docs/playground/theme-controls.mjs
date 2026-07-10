const ORDER = ['github-light', 'github-dark', 'ocean', 'sunset', 'monochrome'];

export function presetNames(api) {
  const available = api && api.THEME_PRESETS ? api.THEME_PRESETS : {};
  return ['auto', ...ORDER.filter((name) => name in available), 'custom'];
}

export function parseCustomTheme(source) {
  const value = JSON.parse(source);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('custom theme must be a JSON object');
  }
  return value;
}

function clearTheme(api, target) {
  for (const name of Object.keys(api.resolveTheme('github-light'))) {
    target.style.removeProperty(name);
  }
}

export function applyPlaygroundTheme(api, target, selection, customSource) {
  try {
    if (selection === 'auto') {
      clearTheme(api, target);
      return { ok: true };
    }
    const theme = selection === 'custom' ? parseCustomTheme(customSource) : selection;
    api.resolveTheme(theme);
    clearTheme(api, target);
    api.applyTheme(target, theme);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
