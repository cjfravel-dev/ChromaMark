/**
 * Maps a supported file to how it should open in VS Code.
 *
 * The extension treats `.cm` and `.md` as the `markdown` language; these helpers
 * pick the open behaviour per extension from the user's `chromamark.<ext>.openMode`
 * setting and translate the chosen mode into the built-in Markdown command to run.
 */

export const SUPPORTED_EXTENSIONS = ['cm', 'md'];

const MODE_COMMANDS = {
  preview: 'markdown.reopenAsPreview',
  sourceAndPreview: 'markdown.showPreviewToSide',
  source: null,
};

/** Lower-cased final extension of a path, or undefined when it has none. */
export function extensionKey(path) {
  const match = /\.([^./\\]+)$/.exec(path || '');
  return match ? match[1].toLowerCase() : undefined;
}

/** Whether the extension participates in open-mode handling. */
export function isSupportedExtension(key) {
  return SUPPORTED_EXTENSIONS.includes(key);
}

/** The VS Code command for a mode, or null when the file should stay as source. */
export function commandForMode(mode) {
  const command = MODE_COMMANDS[mode];
  return command == null ? null : command;
}
