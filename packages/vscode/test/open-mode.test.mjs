import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extensionKey, isSupportedExtension, commandForMode, SUPPORTED_EXTENSIONS } from '../src/open-mode.mjs';

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
