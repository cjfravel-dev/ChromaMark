/**
 * ChromaMark VS Code extension. Contributes the ChromaMark renderer to the
 * built-in Markdown preview so `:::` blocks, pills, meters, fields and inline
 * diff render live. Syntax highlighting is provided by the injection grammar in
 * syntaxes/.
 *
 * Bundled with esbuild (renderer + markdown-it inlined) so the VSIX is
 * self-contained and `extendMarkdownIt` can apply the plugin synchronously.
 */

import chromamark from '@chromamark/renderer';

export function activate() {
  return {
    extendMarkdownIt(md) {
      return md.use(chromamark);
    },
  };
}

export function deactivate() {}
