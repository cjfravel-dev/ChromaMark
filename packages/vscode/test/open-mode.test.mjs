import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extensionKey, isSupportedExtension, commandForMode, SUPPORTED_EXTENSIONS, openModeChoices, extensionChoices } from '../src/open-mode.mjs';

test('extensionKey extracts the lower-cased extension from a path', () => {
  assert.equal(extensionKey('/a/b/notes.cm'), 'cm');
  assert.equal(extensionKey('/a/b/NOTES.CM'), 'cm');
  assert.equal(extensionKey('/a/b/readme.md'), 'md');
  assert.equal(extensionKey('/a/b/archive.tar.gz'), 'gz');
  assert.equal(extensionKey('/a/b/no-extension'), undefined);
  assert.equal(extensionKey(''), undefined);
});

test('only cm and md are supported extensions', () => {
  assert.deepEqual([...SUPPORTED_EXTENSIONS].sort(), ['cm', 'md']);
  assert.ok(isSupportedExtension('cm'));
  assert.ok(isSupportedExtension('md'));
  assert.ok(!isSupportedExtension('markdown'));
  assert.ok(!isSupportedExtension('txt'));
  assert.ok(!isSupportedExtension(undefined));
});

test('each open mode maps to the correct VS Code command', () => {
  assert.equal(commandForMode('preview'), 'markdown.reopenAsPreview');
  assert.equal(commandForMode('sourceAndPreview'), 'markdown.showPreviewToSide');
  assert.equal(commandForMode('source'), null, 'source-only runs no command');
});

test('an unknown mode resolves to no command', () => {
  assert.equal(commandForMode('bogus'), null);
  assert.equal(commandForMode(undefined), null);
});

test('openModeChoices lists the three modes in order and marks the current one', () => {
  const items = openModeChoices('sourceAndPreview');
  assert.deepEqual(items.map((i) => i.value), ['preview', 'sourceAndPreview', 'source']);
  for (const i of items) assert.ok(i.label && i.detail, 'each choice has a label and detail');
  const picked = items.filter((i) => i.picked);
  assert.equal(picked.length, 1);
  assert.equal(picked[0].value, 'sourceAndPreview');
  assert.equal(picked[0].description, 'current');
});

test('openModeChoices marks nothing when there is no current value', () => {
  const items = openModeChoices(undefined);
  assert.equal(items.filter((i) => i.picked).length, 0);
  assert.ok(items.every((i) => i.description === undefined));
});

test('extensionChoices lists cm and md, putting the active file type first', () => {
  assert.deepEqual(extensionChoices().map((i) => i.ext), ['cm', 'md']);
  assert.deepEqual(extensionChoices('md').map((i) => i.ext), ['md', 'cm']);
  assert.deepEqual(extensionChoices('cm').map((i) => i.ext), ['cm', 'md']);
  assert.deepEqual(extensionChoices('txt').map((i) => i.ext), ['cm', 'md']);
  for (const i of extensionChoices()) assert.ok(i.label && i.detail);
});
