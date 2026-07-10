import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  THEME_PRESETS,
  resolveTheme,
} from '../src/index.js';
import { applyTheme } from '../src/browser-core.js';
import * as browserApi from '../src/browser-core.js';

test('built-in presets resolve to a complete semantic variable map', () => {
  for (const name of ['github-light', 'github-dark', 'ocean', 'sunset', 'monochrome']) {
    const variables = resolveTheme(name);
    assert.equal(Object.keys(variables).length, 21, name);
    assert.match(variables['--cm-success-fg'], /^#/);
    assert.match(variables['--cm-danger-bg'], /^#/);
    assert.match(variables['--cm-neutral-bd'], /^#/);
    assert.match(variables['--cm-content-fg'], /^#/);
  }
  assert.ok(Object.isFrozen(THEME_PRESETS));
});

test('theme overrides are constrained to semantic tones and safe colors', () => {
  const variables = resolveTheme({
    preset: 'ocean',
    tones: { success: { foreground: '#123456', border: 'navy' } },
    neutral: { background: 'white' },
  });
  assert.equal(variables['--cm-success-fg'], '#123456');
  assert.equal(variables['--cm-success-bd'], 'navy');
  assert.equal(variables['--cm-neutral-bg'], 'white');
  assert.equal(variables['--cm-danger-fg'], THEME_PRESETS.ocean['--cm-danger-fg']);
});

test('theme resolver rejects unknown presets, slots, tones, and CSS injection', () => {
  assert.throws(() => resolveTheme('unknown'), /unknown theme preset/);
  assert.throws(() => resolveTheme({ tones: { brand: { foreground: 'red' } } }), /unknown theme tone/);
  assert.throws(() => resolveTheme({ tones: { success: { glow: 'red' } } }), /unknown theme slot/);
  assert.throws(
    () => resolveTheme({ tones: { success: { foreground: 'url(javascript:alert(1))' } } }),
    /unsafe theme color/,
  );
});

test('applyTheme writes only resolved semantic variables to an element', () => {
  const dom = new JSDOM('<main id="report"></main>');
  const report = dom.window.document.getElementById('report');
  assert.equal(applyTheme(report, 'sunset'), report);
  assert.equal(report.style.getPropertyValue('--cm-success-fg'), THEME_PRESETS.sunset['--cm-success-fg']);
  assert.equal(report.style.getPropertyValue('--cm-neutral-bd'), THEME_PRESETS.sunset['--cm-neutral-bd']);
  assert.equal(report.style.getPropertyValue('--cm-content-fg'), THEME_PRESETS.sunset['--cm-content-fg']);
});

test('dark preset supplies readable content text independently of the host theme', () => {
  assert.equal(THEME_PRESETS['github-dark']['--cm-content-fg'], '#e6edf3');
  assert.equal(THEME_PRESETS['github-light']['--cm-content-fg'], '#1f2328');
});

test('applyTheme accepts a Document and rejects non-style targets', () => {
  const dom = new JSDOM('<html><body></body></html>');
  assert.equal(applyTheme(dom.window.document, 'monochrome'), dom.window.document.documentElement);
  assert.throws(() => applyTheme({}, 'ocean'), /style-capable Element or Document/);
});

test('browser global API exposes presets, resolution, and application', () => {
  assert.equal(browserApi.ChromaMark.THEME_PRESETS, THEME_PRESETS);
  assert.equal(browserApi.ChromaMark.resolveTheme('ocean')['--cm-info-fg'], THEME_PRESETS.ocean['--cm-info-fg']);
  assert.equal(browserApi.ChromaMark.applyTheme, applyTheme);
});
