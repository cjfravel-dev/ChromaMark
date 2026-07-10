import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  presetNames,
  parseCustomTheme,
  applyPlaygroundTheme,
} from './theme-controls.mjs';

const variables = {
  '--cm-success-fg': '#111111',
  '--cm-neutral-bg': '#eeeeee',
};

function fakeApi() {
  return {
    THEME_PRESETS: { ocean: {}, sunset: {}, monochrome: {}, 'github-light': {}, 'github-dark': {} },
    resolveTheme: (input) => {
      if (input?.tones?.success?.foreground === 'url(x)') throw new Error('unsafe theme color');
      return variables;
    },
    applyTheme: (target, input) => {
      target.applied = input;
      return target;
    },
  };
}

test('preset selector exposes auto and every built-in preset', () => {
  assert.deepEqual(presetNames(fakeApi()), [
    'auto', 'github-light', 'github-dark', 'ocean', 'sunset', 'monochrome', 'custom',
  ]);
});

test('custom theme JSON parses to a constrained theme config', () => {
  assert.deepEqual(
    parseCustomTheme('{"preset":"ocean","tones":{"success":{"foreground":"#123456"}}}'),
    { preset: 'ocean', tones: { success: { foreground: '#123456' } } },
  );
  assert.throws(() => parseCustomTheme('[]'), /JSON object/);
});

test('applying themes clears prior variables and handles auto, presets, and custom errors', () => {
  const removed = [];
  const target = {
    style: {
      removeProperty: (name) => removed.push(name),
    },
  };
  const api = fakeApi();
  assert.deepEqual(applyPlaygroundTheme(api, target, 'auto', ''), { ok: true });
  assert.ok(removed.includes('--cm-success-fg'));

  assert.deepEqual(applyPlaygroundTheme(api, target, 'sunset', ''), { ok: true });
  assert.equal(target.applied, 'sunset');

  const invalidRemoved = [];
  const invalidTarget = { style: { removeProperty: (name) => invalidRemoved.push(name) } };
  const invalid = applyPlaygroundTheme(
    api,
    invalidTarget,
    'custom',
    '{"tones":{"success":{"foreground":"url(x)"}}}',
  );
  assert.equal(invalid.ok, false);
  assert.match(invalid.error, /unsafe theme color/);
  assert.deepEqual(invalidRemoved, []);
});
